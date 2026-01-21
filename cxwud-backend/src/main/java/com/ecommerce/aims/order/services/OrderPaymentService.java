package com.ecommerce.aims.order.services;

import com.ecommerce.aims.cart.services.CartService;
import com.ecommerce.aims.common.exception.NotFoundException;
import com.ecommerce.aims.order.models.Order;
import com.ecommerce.aims.order.models.OrderStatus;
import com.ecommerce.aims.order.repository.OrderRepository;
import com.ecommerce.aims.product.services.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderPaymentService {

    private final OrderRepository orderRepository;
    private final StockService stockService;
    private final CartService cartService;

    @Transactional
    public void handlePaymentCaptured(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.PENDING_PROCESSING) {
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);

            // Clear the customer's cart after successful payment
            if (order.getCartSessionKey() != null) {
                clearCart(order.getCartSessionKey());
            }
        }
    }

    @Transactional
    public void handlePaymentTimeout(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.PENDING_PROCESSING) {
            order.setStatus(OrderStatus.FAILED);
            stockService.restoreStock(order.getItems());
            orderRepository.save(order);

            // Reset checkout flag so user can try again with same cart
            if (order.getCartSessionKey() != null) {
                resetCartCheckout(order.getCartSessionKey());
            }
        }
    }

    @Transactional
    public void handleUserCancelledPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.PENDING_PROCESSING) {
            order.setStatus(OrderStatus.FAILED);
            stockService.restoreStock(order.getItems());
            orderRepository.save(order);

            // Reset checkout flag so user can try again with same cart
            if (order.getCartSessionKey() != null) {
                resetCartCheckout(order.getCartSessionKey());
            }
        }
    }

    private void clearCart(String sessionKey) {
        try {
            cartService.clearCart(sessionKey);
        } catch (Exception e) {
            // Log but don't fail the payment capture if cart clearing fails
            // The order is already paid, cart clearing is just cleanup
            System.err.println("Failed to clear cart for session: " + sessionKey + ". Error: " + e.getMessage());
        }
    }

    private void resetCartCheckout(String sessionKey) {
        try {
            cartService.resetCheckout(sessionKey);
        } catch (Exception e) {
            // Log but don't fail the order cancellation if cart reset fails
            System.err
                    .println("Failed to reset cart checkout for session: " + sessionKey + ". Error: " + e.getMessage());
        }
    }
}
