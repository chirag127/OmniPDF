# Changelog

All notable changes to the OmniPDF project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-05-19T01:35:32.691Z

### Added

-   Compress PDF feature
    -   Backend API endpoint for compressing PDFs with different compression levels
    -   Support for basic and strong compression options
    -   Fallback mechanism when Ghostscript is not available
    -   Frontend page for compressing PDFs with compression level selection
    -   PDF preview for uploaded documents
    -   Unit tests for both frontend and backend

## [0.2.0] - 2025-05-19T01:13:38.356Z

### Added

-   Split PDF feature
    -   Backend API endpoint for splitting PDFs by page ranges
    -   Backend API endpoint for extracting all pages as separate PDFs
    -   Frontend page for splitting PDFs with page range input
    -   Option to extract all pages as separate PDFs (downloaded as ZIP)
    -   Page preview for uploaded PDFs
    -   Unit tests for both frontend and backend

## [0.1.0] - 2025-05-19

### Added

-   Initial project setup
-   Frontend project initialization with React, Vite, and TypeScript
-   Backend project initialization with NestJS and TypeScript
-   Project directory structure according to the masterplan
-   Basic README.md with project information
-   CHANGELOG.md file
-   Asset generation script in scripts/generate-assets.js
-   Merge PDF feature
    -   Backend API endpoint for merging multiple PDFs
    -   Frontend page for uploading and reordering PDFs
    -   Unit tests for both frontend and backend
