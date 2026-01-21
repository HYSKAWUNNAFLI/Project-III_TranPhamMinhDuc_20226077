package com.ecommerce.aims.user.repository;

import com.ecommerce.aims.user.models.Role;
import com.ecommerce.aims.user.models.RoleName;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IRoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);

    boolean existsByName(RoleName name);

    List<Role> findByNameIn(Set<RoleName> names);

    @Query("SELECT r FROM Role r WHERE r.name IN :names")
    Set<Role> findAllByNames(@Param("names") Set<RoleName> names);
}
