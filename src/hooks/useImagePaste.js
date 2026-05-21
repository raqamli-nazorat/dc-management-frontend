import { useEffect } from 'react';

export function useImagePaste(onPasteImage) {
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const files = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        // Give it a more descriptive name if it's a generic "image.png"
                        const extension = file.type.split('/')[1] || 'png';
                        const newFile = new File([file], `screenshot_${Date.now()}.${extension}`, { type: file.type });
                        files.push(newFile);
                    }
                }
            }
            if (files.length > 0) {
                onPasteImage(files);
            }
        };
        
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onPasteImage]);
}

export const readFromClipboard = async () => {
    try {
        const items = await navigator.clipboard.read();
        const files = [];
        for (const item of items) {
            const imageTypes = item.types.filter(type => type.startsWith('image/'));
            for (const type of imageTypes) {
                const blob = await item.getType(type);
                const file = new File([blob], `screenshot_${Date.now()}.${type.split('/')[1] || 'png'}`, { type });
                files.push(file);
            }
        }
        return files;
    } catch (error) {
        console.error('Clipboard read failed:', error);
        throw error;
    }
};
