package com.ecommerce.aims.product.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "type_attributes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"type_id", "attribute_key"})
})
public class TypeAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    @JsonIgnore
    private ProductType productType;

    @Column(name = "attribute_key", nullable = false, length = 50)
    private String key;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false, length = 20)
    private String dataType;

    @Column(nullable = false)
    private boolean isRequired;

}