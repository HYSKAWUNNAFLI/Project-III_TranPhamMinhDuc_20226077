package com.ecommerce.aims.order.services;

import com.ecommerce.aims.cart.models.Cart;
import com.ecommerce.aims.cart.models.CartItem;
import com.ecommerce.aims.cart.repository.CartRepository;
import com.ecommerce.aims.cart.services.CartService;
import com.ecommerce.aims.common.dto.PageResponse;
import com.ecommerce.aims.common.exception.BusinessException;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.common.exception.OutOfStockException;
import com.ecommerce.aims.order.config.OrderExpirationConfig;
import com.ecommerce.aims.order.dto.CalculateShippingFeeRequest;
import com.ecommerce.aims.order.dto.CheckOrderStateRequest;
import com.ecommerce.aims.order.dto.CheckOrderStateResponse;
import com.ecommerce.aims.order.dto.CreateOrderRequest;
import com.ecommerce.aims.order.dto.OrderResponse;
import com.ecommerce.aims.order.dto.UpdateDeliveryInfoRequest;
import com.ecommerce.aims.order.models.DeliveryInfo;
import com.ecommerce.aims.order.models.Invoice;
import com.ecommerce.aims.order.models.InvoiceStatus;
import com.ecommerce.aims.order.models.Order;
import com.ecommerce.aims.order.models.OrderItem;
import com.ecommerce.aims.order.models.OrderStatus;
import com.ecommerce.aims.order.repository.InvoiceRepository;
import com.ecommerce.aims.order.repository.OrderRepository;
import com.ecommerce.aims.payment.models.PaymentStatus;
import com.ecommerce.aims.payment.models.PaymentTransaction;
import com.ecommerce.aims.payment.repository.IPaymentTransactionRepository;
import com.ecommerce.aims.product.models.Product;
import com.ecommerce.aims.product.models.ProductStatus;
import com.ecommerce.aims.product.repository.ProductRepository;
import com.ecommerce.aims.product.services.StockService;
import com.ecommerce.aims.payment.dto.CreatePaymentRequest;
import com.ecommerce.aims.payment.dto.PaymentResultResponse;
import com.ecommerce.aims.payment.models.PaymentProvider;
import com.ecommerce.aims.payment.services.PaymentService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final IPaymentTransactionRepository paymentTransactionRepository;
    private final StockService stockService;
    private final CartService cartService;
    private final CartRepository cartRepository;
    private final PaymentService paymentService;
    private final InvoiceRepository invoiceRepository;
    private final OrderExpirationConfig expirationConfig;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException("Order items must not be empty");
        }

        // Prevent duplicate orders from same cart
        if (request.getCartSessionKey() != null) {
            cartService.markAsCheckedOut(request.getCartSessionKey());
        }

        List<Long> productIds = request.getItems().stream()
                .map(line -> Objects.requireNonNull(line.getProductId(), "productId must not be null"))
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        List<Product> lockedProducts = productRepository.findAllByIdInForUpdate(productIds);
        Map<Long, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        Map<Long, Integer> totalQuantityByProduct = new HashMap<>();
        for (var line : request.getItems()) {
            Long productId = line.getProductId();
            totalQuantityByProduct.merge(productId, line.getQuantity(), Integer::sum);
        }

        for (var entry : totalQuantityByProduct.entrySet()) {
            Long productId = entry.getKey();
            Integer requestedQuantity = entry.getValue();
            Product product = productMap.get(productId);

            if (product == null) {
                throw new NotFoundException("Product not found: " + productId);
            }
            if (product.getStatus() == ProductStatus.DEACTIVATED) {
                throw new BusinessException("Product is deactivated: " + product.getTitle());
            }
            int availableStock = product.getStock() == null ? 0 : product.getStock();
            if (availableStock < requestedQuantity) {
                throw new OutOfStockException(product.getTitle(), productId, requestedQuantity, availableStock);
            }
        }

        for (var entry : totalQuantityByProduct.entrySet()) {
            Long productId = entry.getKey();
            Integer quantity = entry.getValue();
            Product product = productMap.get(productId);
            int currentStock = product.getStock() == null ? 0 : product.getStock();
            product.setStock(currentStock - quantity);
        }

        Order order = new Order();
        order.setId(System.currentTimeMillis());
        order.setStatus(OrderStatus.PENDING_PROCESSING);
        order.setCustomerEmail(request.getCustomerEmail());
        order.setCustomerName(request.getCustomerName());
        order.setCartSessionKey(request.getCartSessionKey());

        request.getItems().forEach(line -> {
            Product product = productMap.get(line.getProductId());
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(line.getProductId());
            item.setProductTitle(product.getTitle());
            item.setQuantity(line.getQuantity());
            BigDecimal price = product.getCurrentPrice() != null ? product.getCurrentPrice() : line.getPrice();
            item.setPrice(price);
            if (price != null && line.getQuantity() != null) {
                item.setTotalPrice(price.multiply(BigDecimal.valueOf(line.getQuantity())));
            }
            order.getItems().add(item);
        });
        BigDecimal totalBeforeVat = order.getItems().stream()
                .map(i -> i.getTotalPrice() == null ? BigDecimal.ZERO : i.getTotalPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalBeforeVat(totalBeforeVat);

        BigDecimal totalWeight = request.getItems().stream()
                .map(line -> {
                    Product product = productMap.get(line.getProductId());
                    BigDecimal weight = product.getWeight() == null ? BigDecimal.ZERO : product.getWeight();
                    return weight.multiply(BigDecimal.valueOf(line.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = calculateShippingFee(totalWeight, totalBeforeVat, request.getProvince());
        order.setShippingFee(shippingFee);
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal totalWithVat = totalBeforeVat.add(vatAmount)
                .add(order.getShippingFee() == null ? BigDecimal.ZERO : order.getShippingFee());
        order.setTotalWithVat(totalWithVat);

        Invoice invoice = Invoice.builder()
                .order(order)
                .status(InvoiceStatus.ACTIVE)
                .deliveryInfo(DeliveryInfo.builder()
                        .recipientName(request.getCustomerName())
                        .phone(request.getPhone())
                        .addressLine(request.getAddressLine())
                        .city("Unknown")
                        .province(request.getProvince())
                        .postalCode("00000")
                        .build())
                .totalBeforeVat(totalBeforeVat)
                .vatAmount(vatAmount)
                .shippingFee(order.getShippingFee())
                .totalWithVat(totalWithVat)
                .build();
        order.setInvoice(invoice);

        // Set expiration time using config
        order.setExpiresAt(LocalDateTime.now().plusMinutes(expirationConfig.getPaymentMinutes()));

        Order saved = orderRepository.save(order);

        CreatePaymentRequest paymentRequest = new CreatePaymentRequest();
        paymentRequest.setOrderId(saved.getId());
        paymentRequest.setProvider(request.getProvider() != null ? request.getProvider() : PaymentProvider.VIETQR);
        paymentRequest.setCurrency(request.getCurrency());
        paymentRequest.setAmount(saved.getTotalWithVat());
        paymentRequest.setSuccessReturnUrl(request.getSuccessReturnUrl());
        paymentRequest.setCancelReturnUrl(request.getCancelReturnUrl());

        PaymentResultResponse paymentResult = paymentService.createPayment(paymentRequest);

        OrderResponse response = toResponse(saved);
        response.setPaymentResult(paymentResult);

        return response;
    }

    public OrderResponse getOrder(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        Order order = orderRepository.findById(requiredId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id must not be null");
        Order order = orderRepository.findById(requiredId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.PENDING_PROCESSING && order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException("Order cannot be cancelled at this stage");
        }

        stockService.restoreStockWithLocking(order.getItems());

        order.setStatus(OrderStatus.FAILED);
        Order saved = orderRepository.save(order);

        // Reset cart checkout flag so user can reuse the same cart
        if (saved.getCartSessionKey() != null) {
            cartService.resetCheckout(saved.getCartSessionKey());
        }

        // Update payment transaction status to FAILED when order is cancelled
        PaymentTransaction transaction = paymentTransactionRepository
                .findTopByOrderIdOrderByCreatedAtDesc(saved.getId())
                .orElse(null);
        if (transaction != null && transaction.getStatus() != PaymentStatus.SUCCESSFULL) {
            transaction.setStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(transaction);
        }

        return toResponse(saved, transaction);
    }

    public PageResponse<OrderResponse> listOrders(int page, int size) {
        Page<Order> pageResult = orderRepository.findAll(PageRequest.of(page, size));
        return PageResponse.<OrderResponse>builder()
                .items(pageResult.map(this::toResponse).getContent())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .build();
    }

    private OrderResponse toResponse(Order order) {
        PaymentTransaction transaction = paymentTransactionRepository
                .findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElse(null);
        return toResponse(order, transaction);
    }

    private OrderResponse toResponse(Order order, PaymentTransaction transaction) {
        Order requiredOrder = Objects.requireNonNull(order, "order must not be null");
        Invoice invoice = requiredOrder.getInvoice();
        return OrderResponse.builder()
                .id(requiredOrder.getId())
                .status(requiredOrder.getStatus())
                .customerEmail(requiredOrder.getCustomerEmail())
                .customerName(requiredOrder.getCustomerName())
                .deliveryInfo(invoice != null ? invoice.getDeliveryInfo() : null)
                .shippingFee(requiredOrder.getShippingFee())
                .totalBeforeVat(requiredOrder.getTotalBeforeVat())
                .totalWithVat(requiredOrder.getTotalWithVat())
                .createdAt(requiredOrder.getCreatedAt())
                .paymentMinutes(expirationConfig.getPaymentMinutes())
                .items(requiredOrder.getItems().stream()
                        .map(item -> OrderResponse.OrderLine.builder()
                                .productId(item.getProductId())
                                .productTitle(item.getProductTitle())
                                .quantity(item.getQuantity())
                                .price(item.getPrice())
                                .totalPrice(item.getTotalPrice())
                                .build())
                        .collect(Collectors.toList()))
                .paymentTransactionId(transaction != null ? transaction.getId() : null)
                .paymentStatus(transaction != null ? transaction.getStatus() : null)
                .build();
    }

    private BigDecimal calculateShippingFee(BigDecimal totalWeight, BigDecimal totalProductPrice, String province) {
        log.info("--- calculateShippingFee ---");
        log.info("Input: weight={}, productPrice={}, province={}", totalWeight, totalProductPrice, province);

        BigDecimal weight = totalWeight == null || totalWeight.signum() < 0 ? BigDecimal.ZERO : totalWeight;

        // Normalize province name to handle Vietnamese accents
        String normalizedProvince = province != null ? province.trim().toLowerCase() : "";
        // Remove Vietnamese accents for comparison
        normalizedProvince = normalizedProvince
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");

        boolean bigCity = normalizedProvince.matches(".*(ha noi|hanoi|ho chi minh|hochiminh|hcm).*");

        log.info("Is big city: {}", bigCity);

        BigDecimal baseWeight = bigCity ? new BigDecimal("3.0") : new BigDecimal("0.5");
        BigDecimal basePrice = bigCity ? new BigDecimal("22000") : new BigDecimal("30000");
        BigDecimal result = basePrice;

        log.info("Base: weight={}, price={}", baseWeight, basePrice);

        BigDecimal extraWeight = weight.subtract(baseWeight);
        log.info("Extra weight: {}", extraWeight);

        if (extraWeight.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal steps = extraWeight.divide(new BigDecimal("0.5"), 0, RoundingMode.UP);
            BigDecimal extraFee = steps.multiply(new BigDecimal("2500"));
            log.info("Extra fee: {} steps x 2500 = {}", steps, extraFee);
            result = result.add(extraFee);
        }

        log.info("Before discount: {}", result);

        if (totalProductPrice != null && totalProductPrice.compareTo(new BigDecimal("100000")) > 0) {
            BigDecimal discount = result.min(new BigDecimal("25000"));
            log.info("Discount applied: {} (min of {} and 25000)", discount, result);
            result = result.subtract(discount);
        }

        log.info("After discount: {}", result);

        if (result.compareTo(BigDecimal.ZERO) < 0) {
            log.info("Result is negative, setting to 0");
            result = BigDecimal.ZERO;
        }

        log.info("Final result: {}", result.setScale(0, RoundingMode.HALF_UP));
        return result.setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Calculate shipping fee from request (public API)
     */
    public BigDecimal calculateShippingFeeFromRequest(CalculateShippingFeeRequest request) {
        log.info("=== Calculate Shipping Fee Request ===");
        log.info("Province: {}", request.getProvince());
        log.info("Cart Value: {}", request.getCartValue());
        log.info("Cart Session Key: {}", request.getCartSessionKey());

        // Fetch cart items to calculate actual weight
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal cartValue = request.getCartValue() != null ? request.getCartValue() : BigDecimal.ZERO;

        // If we have a cart session key, calculate weight from actual cart items
        if (request.getCartSessionKey() != null && !request.getCartSessionKey().trim().isEmpty()) {
            try {
                Optional<Cart> cartOpt = cartRepository.findBySessionKey(request.getCartSessionKey());
                if (cartOpt.isPresent() && !cartOpt.get().getItems().isEmpty()) {
                    Cart cart = cartOpt.get();
                    log.info("Found cart with {} items", cart.getItems().size());

                    // Get all product IDs from cart
                    List<Long> productIds = cart.getItems().stream()
                            .map(CartItem::getProductId)
                            .collect(Collectors.toList());

                    // Fetch products to get weights
                    List<Product> products = productRepository.findAllById(productIds);
                    Map<Long, Product> productMap = products.stream()
                            .collect(Collectors.toMap(Product::getId, p -> p));

                    // Calculate total weight
                    totalWeight = cart.getItems().stream()
                            .map(item -> {
                                Product product = productMap.get(item.getProductId());
                                if (product == null)
                                    return BigDecimal.ZERO;
                                BigDecimal weight = product.getWeight() != null ? product.getWeight() : BigDecimal.ZERO;
                                BigDecimal itemWeight = weight.multiply(BigDecimal.valueOf(item.getQuantity()));
                                log.info("Product ID {}: weight={}, quantity={}, total={}",
                                        item.getProductId(), weight, item.getQuantity(), itemWeight);
                                return itemWeight;
                            })
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    log.info("Total weight calculated: {} kg", totalWeight);
                } else {
                    log.warn("Cart not found or empty for session key: {}", request.getCartSessionKey());
                }
            } catch (Exception e) {
                log.error("Error fetching cart for weight calculation: {}", e.getMessage(), e);
                // If cart not found or error, use default weight = 0
                totalWeight = BigDecimal.ZERO;
            }
        } else {
            log.warn("No cart session key provided, using weight = 0");
        }

        BigDecimal shippingFee = calculateShippingFee(totalWeight, cartValue, request.getProvince());
        log.info("Final shipping fee: {} VND", shippingFee);
        log.info("=== End Calculate Shipping Fee ===");

        return shippingFee;
    }

    /**
     * Check if an existing order can be reused or if a new one should be created
     */
    public CheckOrderStateResponse checkOrderState(CheckOrderStateRequest request) {
        if (request.getSessionKey() == null || request.getSessionKey().trim().isEmpty()) {
            return CheckOrderStateResponse.builder()
                    .action(CheckOrderStateResponse.OrderAction.CREATE_NEW)
                    .message("No session key provided")
                    .build();
        }

        // Find the most recent pending order for this session
        Order existingOrder = orderRepository.findTopByCartSessionKeyAndStatusOrderByCreatedAtDesc(
                request.getSessionKey(), OrderStatus.PENDING_PROCESSING);

        if (existingOrder == null) {
            return CheckOrderStateResponse.builder()
                    .action(CheckOrderStateResponse.OrderAction.CREATE_NEW)
                    .message("No existing pending order found")
                    .build();
        }

        // Compare items
        boolean itemsMatch = compareOrderItems(existingOrder.getItems(), request.getItems());

        if (itemsMatch) {
            return CheckOrderStateResponse.builder()
                    .action(CheckOrderStateResponse.OrderAction.REUSE)
                    .orderId(existingOrder.getId())
                    .message("Cart unchanged, can reuse existing order")
                    .build();
        } else {
            // Items changed - terminate the old order and its invoices
            terminateOrderAndInvoices(existingOrder.getId());

            return CheckOrderStateResponse.builder()
                    .action(CheckOrderStateResponse.OrderAction.CREATE_NEW)
                    .message("Cart items have changed, old order terminated")
                    .build();
        }
    }

    /**
     * Update delivery information for an existing order
     * This will recalculate shipping fee and create a new invoice
     */
    @Transactional
    public OrderResponse updateDeliveryInfo(Long orderId, UpdateDeliveryInfoRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_PROCESSING) {
            throw new BusinessException("Cannot update delivery info for order in status: " + order.getStatus());
        }

        // Check if delivery info has actually changed
        Optional<Invoice> existingInvoiceOpt = invoiceRepository.findByOrderIdAndStatus(order.getId(),
                InvoiceStatus.ACTIVE);

        if (existingInvoiceOpt.isPresent()) {
            Invoice existingInvoice = existingInvoiceOpt.get();
            DeliveryInfo existingDeliveryInfo = existingInvoice.getDeliveryInfo();

            // Check if delivery info is identical
            if (isDeliveryInfoUnchanged(existingDeliveryInfo, request)) {
                // Delivery info unchanged - reuse existing invoice and payment
                log.info("Delivery info unchanged for order {}, reusing existing invoice and payment", orderId);

                // Get existing payment transaction
                PaymentTransaction existingTransaction = paymentTransactionRepository
                        .findTopByOrderIdOrderByCreatedAtDesc(orderId)
                        .orElse(null);

                PaymentResultResponse paymentResult = null;
                if (existingTransaction != null) {
                    paymentResult = PaymentResultResponse.builder()
                            .transactionId(existingTransaction.getId())
                            .status(existingTransaction.getStatus())
                            .qrContent(existingTransaction.getQrContent())
                            .providerReference(existingTransaction.getProviderReference())
                            .build();
                }

                OrderResponse response = toResponse(order);
                response.setPaymentResult(paymentResult);
                return response;
            }
        }

        // Delivery info has changed - calculate new shipping fee
        BigDecimal totalWeight = order.getItems().stream()
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId())
                            .orElse(null);
                    if (product == null)
                        return BigDecimal.ZERO;
                    BigDecimal weight = product.getWeight() == null ? BigDecimal.ZERO : product.getWeight();
                    return weight.multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newShippingFee = calculateShippingFee(totalWeight, order.getTotalBeforeVat(), request.getProvince());
        order.setShippingFee(newShippingFee);

        // Recalculate total with VAT
        BigDecimal vatAmount = order.getTotalBeforeVat().multiply(new BigDecimal("0.10"));
        BigDecimal totalWithVat = order.getTotalBeforeVat().add(vatAmount).add(newShippingFee);
        order.setTotalWithVat(totalWithVat);

        // Update customer info
        order.setCustomerEmail(request.getCustomerEmail());
        order.setCustomerName(request.getCustomerName());

        // Create new invoice
        Invoice newInvoice = Invoice.builder()
                .order(order)
                .status(InvoiceStatus.ACTIVE)
                .deliveryInfo(DeliveryInfo.builder()
                        .recipientName(request.getCustomerName())
                        .phone(request.getPhone())
                        .addressLine(request.getAddressLine())
                        .city("Unknown")
                        .province(request.getProvince())
                        .postalCode("00000")
                        .build())
                .totalBeforeVat(order.getTotalBeforeVat())
                .vatAmount(vatAmount)
                .shippingFee(newShippingFee)
                .totalWithVat(totalWithVat)
                .build();

        // Terminate old ACTIVE invoice if exists
        existingInvoiceOpt.ifPresent(oldInvoice -> {
            oldInvoice.setStatus(InvoiceStatus.TERMINATED);
            invoiceRepository.save(oldInvoice);
            log.info("Terminated old invoice {} for order {}", oldInvoice.getId(), order.getId());
        });

        // Save new invoice
        invoiceRepository.save(newInvoice);
        order.setExpiresAt(LocalDateTime.now().plusMinutes(expirationConfig.getPaymentMinutes()));

        Order savedOrder = orderRepository.save(order);

        // Create new payment transaction
        CreatePaymentRequest paymentRequest = new CreatePaymentRequest();
        paymentRequest.setOrderId(savedOrder.getId());
        // Convert provider string to enum
        if (request.getProvider() != null && !request.getProvider().trim().isEmpty()) {
            try {
                paymentRequest.setProvider(PaymentProvider.valueOf(request.getProvider().toUpperCase()));
            } catch (IllegalArgumentException e) {
                paymentRequest.setProvider(PaymentProvider.VIETQR); // Default to VIETQR
            }
        } else {
            paymentRequest.setProvider(PaymentProvider.VIETQR);
        }
        paymentRequest.setCurrency(request.getCurrency());
        paymentRequest.setAmount(savedOrder.getTotalWithVat());
        paymentRequest.setSuccessReturnUrl(request.getSuccessReturnUrl());
        paymentRequest.setCancelReturnUrl(request.getCancelReturnUrl());

        PaymentResultResponse paymentResult = paymentService.createPayment(paymentRequest);

        OrderResponse response = toResponse(savedOrder);
        response.setPaymentResult(paymentResult);

        return response;
    }

    /**
     * Compare order items with cart items to check if they match
     */
    private boolean compareOrderItems(List<OrderItem> orderItems, List<CheckOrderStateRequest.OrderItemDto> cartItems) {
        if (orderItems.size() != cartItems.size()) {
            return false;
        }

        // Create a map of productId -> quantity for order items
        Map<Long, Integer> orderItemMap = orderItems.stream()
                .collect(Collectors.toMap(
                        OrderItem::getProductId,
                        OrderItem::getQuantity,
                        Integer::sum));

        // Create a map of productId -> quantity for cart items
        Map<Long, Integer> cartItemMap = cartItems.stream()
                .collect(Collectors.toMap(
                        CheckOrderStateRequest.OrderItemDto::getProductId,
                        CheckOrderStateRequest.OrderItemDto::getQuantity,
                        Integer::sum));

        // Compare the two maps
        return orderItemMap.equals(cartItemMap);
    }

    /**
     * Terminate an order and all its associated invoices
     * Called when user changes cart items
     */
    @Transactional
    public void terminateOrderAndInvoices(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Restore stock
        stockService.restoreStockWithLocking(order.getItems());

        // Set order status to TERMINATED
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Set all invoices for this order to TERMINATED
        List<Invoice> invoices = invoiceRepository.findAllByOrderId(orderId);
        for (Invoice invoice : invoices) {
            invoice.setStatus(InvoiceStatus.TERMINATED);
        }
        invoiceRepository.saveAll(invoices);

        log.info("Terminated order {} and {} invoices", orderId, invoices.size());
    }

    /**
     * Check if delivery info is unchanged
     */
    private boolean isDeliveryInfoUnchanged(DeliveryInfo existing, UpdateDeliveryInfoRequest request) {
        if (existing == null) {
            return false;
        }

        return Objects.equals(existing.getRecipientName(), request.getCustomerName())
                && Objects.equals(existing.getPhone(), request.getPhone())
                && Objects.equals(existing.getAddressLine(), request.getAddressLine())
                && Objects.equals(existing.getProvince(), request.getProvince());
    }

}
