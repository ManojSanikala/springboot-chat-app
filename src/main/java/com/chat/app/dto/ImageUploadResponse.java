package com.chat.app.dto;

public class ImageUploadResponse {

    private String fileUrl;

    public ImageUploadResponse() {
    }

    public ImageUploadResponse(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
}