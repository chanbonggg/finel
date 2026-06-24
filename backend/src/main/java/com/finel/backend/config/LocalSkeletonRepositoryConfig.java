package com.finel.backend.config;

import com.finel.backend.auth.AdminRepository;
import com.finel.backend.category.CategoryRepository;
import com.finel.backend.inquiry.InquiryRepository;
import com.finel.backend.product.ProductRepository;
import java.lang.reflect.Proxy;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
public class LocalSkeletonRepositoryConfig {
    @Bean AdminRepository adminRepository() { return emptyRepository(AdminRepository.class); }
    @Bean CategoryRepository categoryRepository() { return emptyRepository(CategoryRepository.class); }
    @Bean ProductRepository productRepository() { return emptyRepository(ProductRepository.class); }
    @Bean InquiryRepository inquiryRepository() { return emptyRepository(InquiryRepository.class); }

    private static <T> T emptyRepository(Class<T> type) {
        Object proxy = Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, (instance, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                return switch (method.getName()) {
                    case "toString" -> "LocalSkeleton" + type.getSimpleName();
                    case "hashCode" -> System.identityHashCode(instance);
                    case "equals" -> instance == args[0];
                    default -> null;
                };
            }
            if ((method.getName().equals("save") || method.getName().equals("saveAndFlush")) && args != null && args.length > 0) return args[0];
            Class<?> result = method.getReturnType();
            if (result == boolean.class) return false;
            if (result == long.class) return 0L;
            if (result == int.class) return 0;
            if (Optional.class.isAssignableFrom(result)) return Optional.empty();
            if (Collection.class.isAssignableFrom(result)) return List.of();
            return null;
        });
        return type.cast(proxy);
    }
}
