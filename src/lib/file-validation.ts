type FileTypeValidator = {
  extensions: string[];
  mimeTypes: string[];
  description: string;
};

// Define common file type validators
export const fileTypeValidators: Record<string, FileTypeValidator> = {
  '.pdf': {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    description: 'PDF Document'
  },
  '.doc,.docx': {
    extensions: ['.doc', '.docx'],
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    description: 'Word Document'
  },
  '.jpg,.jpeg,.png': {
    extensions: ['.jpg', '.jpeg', '.png'],
    mimeTypes: ['image/jpeg', 'image/png'],
    description: 'Image File'
  },
  '.zip,.rar': {
    extensions: ['.zip', '.rar'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/octet-stream'],
    description: 'Archive File'
  },
  '.js,.ts,.html,.css,.py': {
    extensions: ['.js', '.ts', '.html', '.css', '.py'],
    mimeTypes: [
      'text/javascript', 
      'application/javascript', 
      'text/typescript',
      'text/html',
      'text/css',
      'text/x-python',
      'application/x-python',
      'text/plain'
    ],
    description: 'Code File'
  }
};

/**
 * Validates a file against allowed file types
 * @param file The file to validate
 * @param allowedTypes Array of file type strings (e.g. ['.pdf', '.doc,.docx'])
 * @returns An object containing whether the file is valid and any error message
 */
export const validateFile = (
  file: File, 
  allowedTypes: string[],
  maxFileSize: number = 10 // Default 10MB
): { valid: boolean; error?: string } => {
  // If no types specified, consider valid
  if (!allowedTypes || allowedTypes.length === 0) {
    // Just check the size
    if (file.size > maxFileSize * 1024 * 1024) {
      return { 
        valid: false, 
        error: `File size exceeds the maximum limit of ${maxFileSize}MB` 
      };
    }
    return { valid: true };
  }
  
  // Get the file extension
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  
  // Check if the file extension matches any of the allowed types
  const matchedTypeKey = allowedTypes.find(type => 
    type.split(',').some(ext => ext.toLowerCase() === fileExt)
  );
  
  if (!matchedTypeKey) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  // If we have a specific validator for this type, also check MIME type
  const validator = fileTypeValidators[matchedTypeKey];
  if (validator) {
    const mimeTypeValid = validator.mimeTypes.some(mimeType => {
      // Some browsers/systems use variations of MIME types
      if (mimeType.includes('octet-stream') && file.type.includes('octet-stream')) {
        return true;
      }
      return file.type === mimeType || file.type.startsWith(mimeType);
    });
    
    if (!mimeTypeValid) {
      return { 
        valid: false, 
        error: `File appears to be an invalid ${validator.description}` 
      };
    }
  }
  
  // Check file size
  if (file.size > maxFileSize * 1024 * 1024) {
    return { 
      valid: false, 
      error: `File size exceeds the maximum limit of ${maxFileSize}MB` 
    };
  }
  
  return { valid: true };
};

/**
 * Validates multiple files against allowed types
 * @param files Array of files to validate
 * @param allowedTypes Array of file type strings
 * @param maxFiles Maximum number of files allowed
 * @param maxFileSize Maximum size per file in MB
 * @returns An object containing whether all files are valid and any error message
 */
export const validateFiles = (
  files: File[],
  allowedTypes: string[],
  maxFiles: number = 1,
  maxFileSize: number = 10
): { valid: boolean; error?: string } => {
  // Check number of files
  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Maximum ${maxFiles} file(s) allowed`
    };
  }
  
  // Validate each file
  for (const file of files) {
    const validation = validateFile(file, allowedTypes, maxFileSize);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}; 