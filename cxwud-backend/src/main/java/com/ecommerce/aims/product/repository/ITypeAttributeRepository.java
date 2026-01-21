package com.ecommerce.aims.product.repository;

import com.ecommerce.aims.product.models.ProductType;
import com.ecommerce.aims.product.models.TypeAttribute;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ITypeAttributeRepository extends JpaRepository<TypeAttribute, Long> {
    @Query("select t from TypeAttribute t where t.productType = :productType and t.isRequired = true")
    List<TypeAttribute> findRequiredByProductType(@Param("productType") ProductType productType);
}
