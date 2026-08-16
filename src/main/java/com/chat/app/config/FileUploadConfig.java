package com.chat.app.config;

import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileUploadConfig
        implements WebMvcConfigurer {

	@Override
	public void addResourceHandlers(
	        ResourceHandlerRegistry registry) {


	    // =====================================================
	    // IMAGE UPLOADS
	    // =====================================================

	    String imageUploadPath =
	            Paths.get(
	                "uploads/images"
	            )
	            .toAbsolutePath()
	            .toUri()
	            .toString();


	    registry
	        .addResourceHandler(
	            "/uploads/images/**"
	        )
	        .addResourceLocations(
	            imageUploadPath
	        );


	    // =====================================================
	    // GENERAL FILE UPLOADS
	    // =====================================================

	    String fileUploadPath =
	            Paths.get(
	                "uploads/files"
	            )
	            .toAbsolutePath()
	            .toUri()
	            .toString();


	    registry
	        .addResourceHandler(
	            "/uploads/files/**"
	        )
	        .addResourceLocations(
	            fileUploadPath
	        );

	
    }
}