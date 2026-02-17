import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Global React for tests if needed, though plugin handles it usually.
// But importing it here ensures it's available.
global.React = React;

// Mock heic2any
vi.mock('heic2any', () => ({
    default: vi.fn().mockResolvedValue(new Blob([''], { type: 'image/jpeg' }))
}));
