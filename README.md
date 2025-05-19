# OmniPDF - All-in-One PDF Toolkit

A user-friendly web application designed to offer a comprehensive suite of tools for managing and manipulating PDF documents.

## Project Overview

OmniPDF is a web application that provides a convenient, accessible, and cost-effective one-stop-shop for individuals and small to medium-sized businesses (SMBs) who frequently work with PDFs. The application focuses on the most commonly used PDF functionalities, with a plan to incrementally add more specialized tools.

## Features

-   **Merge PDF**: Combine multiple PDF files into one with reordering capability
-   **Split PDF**: Extract specific pages or ranges of pages from a PDF
-   **Compress PDF**: Reduce PDF file size with selectable compression levels
-   **Edit PDF (Basic)**: Add annotations, fill forms, and organize pages
-   **Sign PDF**: Add electronic signatures to PDF documents
-   **Convert PDF**: Convert between PDF and other formats (Images, Word)

## Tech Stack

-   **Frontend**: React (Vite), TypeScript, Tailwind CSS
-   **Backend**: Node.js with NestJS framework (TypeScript)
-   **Database**: PostgreSQL (for user accounts)
-   **PDF Processing**: pdf-lib.js, PDF.js (client-side), pdf-lib, Ghostscript/qpdf (server-side)
-   **Job Queue**: BullMQ with Redis

## Prerequisites

-   Node.js (v18 or higher)
-   npm (v9 or higher)
-   PostgreSQL (if implementing user accounts)
-   Redis (for job queue)

## Installation

1. Clone the repository:

    ```
    git clone https://github.com/chirag127/OmniPDF.git
    cd OmniPDF
    ```

2. Install frontend dependencies:

    ```
    cd frontend
    npm install
    ```

3. Install backend dependencies:

    ```
    cd ../backend
    npm install
    ```

4. Set up environment variables:
    - Copy `.env.example` to `.env` in both frontend and backend directories
    - Update the values according to your environment

## Running the Project

1. Start the backend server:

    ```
    cd backend
    npm run start:dev
    ```

2. Start the frontend development server:

    ```
    cd frontend
    npm run dev
    ```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
omnipdf-toolkit/
├── frontend/                   # React (Vite) application
│   ├── src/
│   │   ├── assets/             # SVGs, static images
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Main layout components
│   │   ├── pages/              # Top-level page components
│   │   ├── services/           # API call functions, client-side PDF logic
│   │   ├── styles/             # Global styles, Tailwind config
│   │   └── utils/              # Utility functions
├── backend/                    # Node.js (NestJS) application
│   ├── src/
│   │   ├── auth/               # Authentication module
│   │   ├── config/             # Configuration management
│   │   ├── jobs/               # Job queue processors
│   │   ├── pdf-tools/          # PDF tool functionalities
│   │   ├── shared/             # Shared utilities, DTOs, interfaces
│   │   └── user/               # User module
├── scripts/                    # Build/utility scripts
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chirag Singhal ([@chirag127](https://github.com/chirag127))

Last Updated: 2025-05-19T00:19:00.042Z
