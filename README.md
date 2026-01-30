# Design Editor

A powerful design editor built with Next.js, TypeScript, and Tailwind CSS that allows users to create and edit designs with text and image elements.

## Features

- **Text Editing**: Add, edit, and style text elements
- **Image Editing**: Upload and manipulate images
- **Drag and Drop**: Move elements around the canvas
- **Selection**: Select and delete elements
- **Responsive Design**: Clean and modern UI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding Elements
- Click "Add Text" to add a text element to the canvas
- Click "Add Image" to upload and add an image

### Editing Elements
- Double-click on text elements to edit their content
- Click on any element to select it
- Drag selected elements to move them around
- Press "Delete" key or click "Delete Selected" to remove selected elements

### Technical Stack
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **UUID** - Unique identifiers

## Project Structure

```
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── DesignCanvas.tsx
├── store/
│   └── canvas-store.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```
