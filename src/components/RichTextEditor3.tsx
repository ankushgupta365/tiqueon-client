import { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code,
  Link,
  Paperclip,
  X,
  Eraser,
  Trash2,
  FileText,
  FileVideo,
  FileImage,
  File,
  Check,
  AtSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';


// Types
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  thumbnailUrl?: string;
}


interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}


interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  heading1: boolean;
  heading2: boolean;
  heading3: boolean;
  blockquote: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  code: boolean;
}


interface RichTextEditorProps {
  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  value?: string;
  onChange?: (value: string) => void;
}

interface RichTextEditorRef {
  getContent: () => string;
  setContent: (html: string) => void;
  clear: () => void;
  focus: () => void;
  getFiles: () => UploadedFile[];
}


// Mock users for mention feature
const MOCK_USERS: MentionUser[] = [
  { id: '1', username: 'alice', displayName: 'Alice Johnson', avatarUrl: undefined },
  { id: '2', username: 'bob', displayName: 'Bob Smith', avatarUrl: undefined },
  { id: '3', username: 'charlie', displayName: 'Charlie Brown', avatarUrl: undefined },
  { id: '4', username: 'diana', displayName: 'Diana Ross', avatarUrl: undefined },
  { id: '5', username: 'edward', displayName: 'Edward Norton', avatarUrl: undefined },
  { id: '6', username: 'fiona', displayName: 'Fiona Apple', avatarUrl: undefined },
  { id: '7', username: 'george', displayName: 'George Lucas', avatarUrl: undefined },
  { id: '8', username: 'hannah', displayName: 'Hannah Montana', avatarUrl: undefined },
];


// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);


// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};


// Helper to get file icon based on type
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type === 'application/pdf' || type.includes('document')) return FileText;
  return File;
};


// Helper to get file type label
const getFileTypeLabel = (type: string): string => {
  if (type.startsWith('image/')) return 'Image';
  if (type.startsWith('video/')) return 'Video';
  if (type === 'application/pdf') return 'PDF';
  if (type.includes('word') || type.includes('document')) return 'Document';
  if (type.includes('sheet') || type.includes('excel')) return 'Spreadsheet';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentation';
  return 'File';
};


// Toolbar button component
interface ToolbarButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  testId?: string;
}


const ToolbarButton = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  disabled = false,
  variant = 'default',
  testId,
}: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          'h-8 w-8 transition-colors',
          isActive && 'bg-accent text-accent-foreground',
          variant === 'destructive' && 'hover:bg-destructive/10 hover:text-destructive'
        )}
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        data-testid={testId}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {label}
    </TooltipContent>
  </Tooltip>
);


// Toolbar divider component
const ToolbarDivider = () => (
  <div className="h-6 w-px bg-border mx-1" />
);


// File placeholder component
interface FilePlaceholderProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}


const FilePlaceholder = ({ file, onRemove }: FilePlaceholderProps) => {
  const isImage = file.type.startsWith('image/');
  const FileIcon = getFileIcon(file.type);


  return (
    <div
      className="group relative inline-flex items-center gap-2 rounded-md border border-border bg-card p-3 my-2 max-w-[400px] hover-elevate"
      contentEditable={false}
      data-testid={`file-placeholder-${file.id}`}
    >
      {isImage && file.thumbnailUrl ? (
        <div className="relative">
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="h-16 w-16 rounded object-cover"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
          <FileIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate" title={file.name}>
          {file.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
        data-testid={`button-remove-file-${file.id}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};


// Mention tag component
interface MentionTagProps {
  user: MentionUser;
}


const MentionTag = ({ user }: MentionTagProps) => (
  <span
    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary mx-0.5"
    contentEditable={false}
    data-mention-id={user.id}
    data-testid={`mention-tag-${user.username}`}
  >
    <AtSign className="h-3 w-3" />
    {user.displayName}
  </span>
);


// Mention dropdown component
interface MentionDropdownProps {
  users: MentionUser[];
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
  position: { top: number; left: number };
}


const MentionDropdown = ({
  users,
  selectedIndex,
  onSelect,
  position,
}: MentionDropdownProps) => (
  <div
    className="absolute z-50 w-64 max-h-[250px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
    style={{ top: position.top, left: position.left }}
    data-testid="mention-dropdown"
  >
    {users.length === 0 ? (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        No users found
      </div>
    ) : (
      users.map((user, index) => (
        <button
          key={user.id}
          type="button"
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover-elevate',
            index === selectedIndex && 'bg-accent'
          )}
          onClick={() => onSelect(user)}
          data-testid={`mention-option-${user.username}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">@{user.username}</span>
          </div>
        </button>
      ))
    )}
  </div>
);


// Link dialog component
interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}


const LinkDialog = ({ isOpen, onClose, onSubmit, initialUrl = '' }: LinkDialogProps) => {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, initialUrl]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      onSubmit(formattedUrl);
    }
    onClose();
  };


  if (!isOpen) return null;


  return (
    <div className="absolute z-50 mt-1 w-80 rounded-md border border-border bg-popover p-3 shadow-lg" data-testid="link-dialog">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          data-testid="input-link-url"
        />
        <Button type="submit" size="icon" data-testid="button-submit-link">
          <Check className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={onClose} data-testid="button-cancel-link">
          <X className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};


// Main Rich Text Editor component
export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      placeholder = 'Start typing...',
      className,
      minHeight = 300,
      maxHeight = 400,
      value,
      onChange,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [formatState, setFormatState] = useState<FormatState>({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      heading1: false,
      heading2: false,
      heading3: false,
      blockquote: false,
      unorderedList: false,
      orderedList: false,
      code: false,
    });
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkDialogPosition, setLinkDialogPosition] = useState({ top: 0, left: 0 });
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);


    // Mention state
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
    const [mentionStartOffset, setMentionStartOffset] = useState<number | null>(null);
    const [mentionNode, setMentionNode] = useState<Node | null>(null);


    // Filter users based on mention query
    const filteredUsers = MOCK_USERS.filter(
      (user) =>
        user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
    );


    // Sync external value changes to editor
    useEffect(() => {
      if (editorRef.current && value !== undefined && value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
    }, [value]);


    // Expose methods via ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref({
            getContent: () => editorRef.current?.innerHTML || '',
            setContent: (html: string) => {
              if (editorRef.current) {
                editorRef.current.innerHTML = html;
              }
            },
            clear: () => {
              if (editorRef.current) {
                editorRef.current.innerHTML = '';
                setUploadedFiles([]);
                setFormatState({
                  bold: false,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  heading1: false,
                  heading2: false,
                  heading3: false,
                  blockquote: false,
                  unorderedList: false,
                  orderedList: false,
                  code: false,
                });
                triggerOnChange('');
              }
            },
            focus: () => editorRef.current?.focus(),
            getFiles: () => uploadedFiles,
          });
        } else {
          ref.current = {
            getContent: () => editorRef.current?.innerHTML || '',
            setContent: (html: string) => {
              if (editorRef.current) {
                editorRef.current.innerHTML = html;
              }
            },
            clear: () => {
              if (editorRef.current) {
                editorRef.current.innerHTML = '';
                setUploadedFiles([]);
                setFormatState({
                  bold: false,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  heading1: false,
                  heading2: false,
                  heading3: false,
                  blockquote: false,
                  unorderedList: false,
                  orderedList: false,
                  code: false,
                });
                triggerOnChange('');
              }
            },
            focus: () => editorRef.current?.focus(),
            getFiles: () => uploadedFiles,
          };
        }
      }
    }, [uploadedFiles]);


    // Save current selection
    const saveSelection = useCallback(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        return selection.getRangeAt(0).cloneRange();
      }
      return null;
    }, []);


    // Restore saved selection
    const restoreSelection = useCallback((range: Range | null) => {
      if (range) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, []);


    // Update format state based on current selection
    const updateFormatState = useCallback(() => {
      const newState: FormatState = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        heading1: false,
        heading2: false,
        heading3: false,
        blockquote: false,
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        code: false,
      };


      // Check for block-level formats
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            if (tagName === 'h1') newState.heading1 = true;
            if (tagName === 'h2') newState.heading2 = true;
            if (tagName === 'h3') newState.heading3 = true;
            if (tagName === 'blockquote') newState.blockquote = true;
            if (tagName === 'pre' || tagName === 'code') newState.code = true;
          }
          node = node.parentNode;
        }
      }


      setFormatState(newState);
    }, []);


    // Trigger onChange callback
    const triggerOnChange = useCallback((content?: string) => {
      if (onChange) {
        const htmlContent = content !== undefined ? content : (editorRef.current?.innerHTML || '');
        onChange(htmlContent);
      }
    }, [onChange]);


    // Execute format command
    const execCommand = useCallback((command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      updateFormatState();
      triggerOnChange();
    }, [updateFormatState, triggerOnChange]);


    // Toggle inline format (bold, italic, etc.)
    const toggleInlineFormat = useCallback((command: string) => {
      execCommand(command);
    }, [execCommand]);


    // Apply block format (headings, blockquote, etc.)
    const applyBlockFormat = useCallback((tagName: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;


      // Check if already in this format
      let currentBlock: HTMLElement | null = null;
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (['H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'P', 'DIV'].includes(element.tagName)) {
            currentBlock = element;
            break;
          }
        }
        node = node.parentNode;
      }


      if (currentBlock) {
        if (currentBlock.tagName.toLowerCase() === tagName.toLowerCase()) {
          // Remove the format - convert to paragraph
          execCommand('formatBlock', 'p');
        } else {
          // Apply new format
          execCommand('formatBlock', tagName);
        }
      } else {
        execCommand('formatBlock', tagName);
      }
    }, [execCommand]);


    // Toggle list format
    const toggleListFormat = useCallback((ordered: boolean) => {
      execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
    }, [execCommand]);


    // Insert code block
    const insertCodeBlock = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;


      // Check if already in code block
      let inCodeBlock = false;
      let codeElement: HTMLElement | null = null;
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName === 'PRE' || element.tagName === 'CODE') {
            inCodeBlock = true;
            codeElement = element;
            break;
          }
        }
        node = node.parentNode;
      }


      if (inCodeBlock && codeElement) {
        // Remove code block - extract text and replace with paragraph
        const text = codeElement.textContent || '';
        const p = document.createElement('p');
        p.textContent = text;
        codeElement.parentNode?.replaceChild(p, codeElement);


        // Place cursor in the new paragraph
        const range = document.createRange();
        range.selectNodeContents(p);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Insert code block
        const selectedText = selection.toString() || 'code here';
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = selectedText;
        pre.appendChild(code);
        pre.className = 'bg-muted rounded-md p-4 font-mono text-sm my-2 overflow-x-auto';


        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(pre);


        // Move cursor after code block
        range.setStartAfter(pre);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }


      updateFormatState();
      triggerOnChange();
    }, [updateFormatState, triggerOnChange]);


    // Handle link insertion
    const handleLinkClick = useCallback(() => {
      const range = saveSelection();
      if (range) {
        setSavedSelection(range);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();
        if (editorRect) {
          setLinkDialogPosition({
            top: rect.bottom - editorRect.top + 8,
            left: Math.max(0, rect.left - editorRect.left),
          });
        }
        setShowLinkDialog(true);
      }
    }, [saveSelection]);


    const insertLink = useCallback((url: string) => {
      if (savedSelection) {
        restoreSelection(savedSelection);
        execCommand('createLink', url);
        setSavedSelection(null);
      }
      setShowLinkDialog(false);
    }, [savedSelection, restoreSelection, execCommand]);


    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;


      const newFiles: UploadedFile[] = [];


      Array.from(files).forEach((file) => {
        const uploadedFile: UploadedFile = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
        };


        // Generate thumbnail for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            uploadedFile.thumbnailUrl = event.target?.result as string;
            uploadedFile.url = event.target?.result as string;
            setUploadedFiles((prev) => {
              const updated = [...prev];
              const index = updated.findIndex((f) => f.id === uploadedFile.id);
              if (index !== -1) {
                updated[index] = uploadedFile;
              }
              return updated;
            });
          };
          reader.readAsDataURL(file);
        }


        newFiles.push(uploadedFile);
      });


      setUploadedFiles((prev) => [...prev, ...newFiles]);


      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, []);


    const removeFile = useCallback((id: string) => {
      setUploadedFiles((prev) => {
        return prev.filter((f) => f.id !== id);
      });
    }, []);


    // Handle mention keyboard navigation
    const handleMentionKeyboard = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (showMentionDropdown) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionSelectedIndex((prev) =>
            prev < filteredUsers.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && filteredUsers.length > 0) {
          e.preventDefault();
          insertMention(filteredUsers[mentionSelectedIndex]);
        } else if (e.key === 'Escape') {
          setShowMentionDropdown(false);
        } else if (e.key === ' ') {
          setShowMentionDropdown(false);
        }
      }
    }, [showMentionDropdown, filteredUsers, mentionSelectedIndex]);


    // Helper to check if character is whitespace (including non-breaking space)
    const isWhitespace = useCallback((char: string): boolean => {
      return /[\s\u00A0\u200B]/.test(char);
    }, []);


    // Detect @ mention in text and show dropdown
    const detectMention = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowMentionDropdown(false);
        return;
      }


      const range = selection.getRangeAt(0);
      const node = range.startContainer;


      // Clear mention state if not in a text node
      if (node.nodeType !== Node.TEXT_NODE) {
        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionStartOffset(null);
        setMentionNode(null);
        return;
      }


      const text = node.textContent || '';
      const cursorPosition = range.startOffset;


      // Find the @ symbol before cursor
      let atIndex = -1;
      for (let i = cursorPosition - 1; i >= 0; i--) {
        const char = text[i];
        if (char === '@') {
          atIndex = i;
          break;
        }
        // Stop if we hit any whitespace (including non-breaking space)
        if (isWhitespace(char)) {
          break;
        }
      }


      if (atIndex >= 0) {
        // Check if @ is at start of text or preceded by whitespace
        const charBefore = atIndex > 0 ? text[atIndex - 1] : ' ';
        if (isWhitespace(charBefore) || atIndex === 0) {
          const rawQuery = text.substring(atIndex + 1, cursorPosition);


          // Check if query contains any whitespace - if so, close dropdown
          if (/[\s\u00A0\u200B]/.test(rawQuery)) {
            setShowMentionDropdown(false);
            setMentionQuery('');
            setMentionStartOffset(null);
            setMentionNode(null);
            return;
          }


          // Sanitize query (remove any special characters)
          const query = rawQuery.trim();


          // Show dropdown
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current?.getBoundingClientRect();


          if (editorRect) {
            setMentionPosition({
              top: rect.bottom - editorRect.top + 8,
              left: Math.max(0, rect.left - editorRect.left - (query.length * 8)),
            });
            setMentionStartOffset(atIndex);
            setMentionNode(node);
            setShowMentionDropdown(true);
            setMentionQuery(query);
            setMentionSelectedIndex(0);
          }
        } else {
          setShowMentionDropdown(false);
          setMentionQuery('');
          setMentionStartOffset(null);
          setMentionNode(null);
        }
      } else {
        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionStartOffset(null);
        setMentionNode(null);
      }
    }, [isWhitespace]);


    // Insert mention
    const insertMention = useCallback((user: MentionUser) => {
      const selection = window.getSelection();
      if (!selection || mentionStartOffset === null || !mentionNode) {
        setShowMentionDropdown(false);
        return;
      }


      // Create the mention element
      const mentionSpan = document.createElement('span');
      mentionSpan.className = 'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary mx-0.5';
      mentionSpan.contentEditable = 'false';
      mentionSpan.setAttribute('data-mention-id', user.id);
      mentionSpan.setAttribute('data-testid', `mention-tag-${user.username}`);
      mentionSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>${user.displayName}`;


      // Find and remove the @query text
      try {
        const textNode = mentionNode;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const beforeAt = text.substring(0, mentionStartOffset);
          const afterQuery = text.substring(selection.anchorOffset);


          // Create new text nodes
          const beforeNode = document.createTextNode(beforeAt);
          const afterNode = document.createTextNode('\u00A0' + afterQuery); // Add non-breaking space after mention


          // Insert nodes
          const parent = textNode.parentNode;
          if (parent) {
            parent.insertBefore(beforeNode, textNode);
            parent.insertBefore(mentionSpan, textNode);
            parent.insertBefore(afterNode, textNode);
            parent.removeChild(textNode);


            // Move cursor after mention
            const range = document.createRange();
            range.setStart(afterNode, 1);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      } catch (err) {
        console.error('Error inserting mention:', err);
      }


      setShowMentionDropdown(false);
      setMentionQuery('');
      setMentionStartOffset(null);
      setMentionNode(null);
      triggerOnChange();
    }, [mentionStartOffset, mentionNode, triggerOnChange]);


    // Handle input for mention detection
    const handleInput = useCallback(() => {
      detectMention();
      triggerOnChange();
    }, [detectMention, triggerOnChange]);


    // Clear all content
    const clearAll = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        setUploadedFiles([]);
        setFormatState({
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          heading1: false,
          heading2: false,
          heading3: false,
          blockquote: false,
          unorderedList: false,
          orderedList: false,
          code: false,
        });
        triggerOnChange('');
      }
    }, [triggerOnChange]);


    // Clear formatting but keep text
    const clearFormatting = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;


      // If no selection, select all content
      if (selection.isCollapsed && editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }


      // Remove all inline formatting
      execCommand('removeFormat');


      // Check if we need to remove block formatting too
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'blockquote', 'pre'].includes(tagName)) {
            // Convert to paragraph
            execCommand('formatBlock', 'p');
            break;
          }
        }
        node = node.parentNode;
      }


      // Remove list formatting if present
      if (document.queryCommandState('insertUnorderedList')) {
        execCommand('insertUnorderedList');
      }
      if (document.queryCommandState('insertOrderedList')) {
        execCommand('insertOrderedList');
      }


      updateFormatState();
    }, [execCommand, updateFormatState]);


    // Handle selection change
    useEffect(() => {
      const handleSelectionChange = () => {
        if (isFocused) {
          updateFormatState();
        }
      };


      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [isFocused, updateFormatState]);


    // Handle click outside for dropdowns
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (showMentionDropdown) {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-testid="mention-dropdown"]')) {
            setShowMentionDropdown(false);
          }
        }
        if (showLinkDialog) {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-testid="link-dialog"]') &&
            !target.closest('[data-testid="button-link"]')) {
            setShowLinkDialog(false);
          }
        }
      };


      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMentionDropdown, showLinkDialog]);


    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      handleMentionKeyboard(e);


      // Handle keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            toggleInlineFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            toggleInlineFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            toggleInlineFormat('underline');
            break;
          case 'k':
            e.preventDefault();
            handleLinkClick();
            break;
        }
      }
    }, [handleMentionKeyboard, toggleInlineFormat, handleLinkClick]);


    return (
      <div className={cn('w-full flex flex-col rounded-lg border border-border bg-background', className)} data-testid="rich-text-editor">
        {/* Toolbar */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-1 border-b border-border p-2 transition-colors',
            !isFocused && 'opacity-70'
          )}
          data-testid="editor-toolbar"
        >
          {/* Text formatting group */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={Bold}
              label="Bold (Ctrl+B)"
              isActive={formatState.bold}
              onClick={() => toggleInlineFormat('bold')}
              testId="button-bold"
            />
            <ToolbarButton
              icon={Italic}
              label="Italic (Ctrl+I)"
              isActive={formatState.italic}
              onClick={() => toggleInlineFormat('italic')}
              testId="button-italic"
            />
            <ToolbarButton
              icon={Underline}
              label="Underline (Ctrl+U)"
              isActive={formatState.underline}
              onClick={() => toggleInlineFormat('underline')}
              testId="button-underline"
            />
            <ToolbarButton
              icon={Strikethrough}
              label="Strikethrough"
              isActive={formatState.strikethrough}
              onClick={() => toggleInlineFormat('strikeThrough')}
              testId="button-strikethrough"
            />
          </div>


          <ToolbarDivider />


          {/* Headings group */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={Heading1}
              label="Heading 1"
              isActive={formatState.heading1}
              onClick={() => applyBlockFormat('h1')}
              testId="button-heading1"
            />
            <ToolbarButton
              icon={Heading2}
              label="Heading 2"
              isActive={formatState.heading2}
              onClick={() => applyBlockFormat('h2')}
              testId="button-heading2"
            />
            <ToolbarButton
              icon={Heading3}
              label="Heading 3"
              isActive={formatState.heading3}
              onClick={() => applyBlockFormat('h3')}
              testId="button-heading3"
            />
          </div>


          <ToolbarDivider />


          {/* Block formatting group */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={Quote}
              label="Blockquote"
              isActive={formatState.blockquote}
              onClick={() => applyBlockFormat('blockquote')}
              testId="button-blockquote"
            />
            <ToolbarButton
              icon={List}
              label="Bulleted List"
              isActive={formatState.unorderedList}
              onClick={() => toggleListFormat(false)}
              testId="button-unordered-list"
            />
            <ToolbarButton
              icon={ListOrdered}
              label="Numbered List"
              isActive={formatState.orderedList}
              onClick={() => toggleListFormat(true)}
              testId="button-ordered-list"
            />
            <ToolbarButton
              icon={Code}
              label="Code Block"
              isActive={formatState.code}
              onClick={insertCodeBlock}
              testId="button-code"
            />
          </div>


          <ToolbarDivider />


          {/* Link and file upload */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={Link}
              label="Insert Link (Ctrl+K)"
              onClick={handleLinkClick}
              testId="button-link"
            />
            <ToolbarButton
              icon={Paperclip}
              label="Attach File"
              onClick={() => fileInputRef.current?.click()}
              testId="button-attach-file"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
              data-testid="input-file-upload"
            />
          </div>


          <div className="flex-1" />


          {/* Clear buttons */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={Eraser}
              label="Clear Formatting"
              onClick={clearFormatting}
              testId="button-clear-formatting"
            />
            <ToolbarButton
              icon={Trash2}
              label="Clear All"
              onClick={clearAll}
              variant="destructive"
              testId="button-clear-all"
            />
          </div>
        </div>


        {/* Editor content area */}
        <div className="relative flex-1">
          <div
            ref={editorRef}
            contentEditable
            className={cn(
              'prose prose-sm max-w-none p-6 outline-none',
              'min-h-[200px] overflow-y-auto',
              '[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:mb-4 [&_h1]:mt-6',
              '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5',
              '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4',
              '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
              '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
              '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
              '[&_li]:my-1',
              '[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-2 [&_pre]:overflow-x-auto',
              '[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
              '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
              'focus:outline-none'
            )}
            style={{
              minHeight: minHeight,
              maxHeight: maxHeight,
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
            data-testid="editor-content"
            suppressContentEditableWarning
          />


          {/* Link Dialog */}
          {showLinkDialog && (
            <div style={{ position: 'absolute', top: linkDialogPosition.top, left: linkDialogPosition.left }}>
              <LinkDialog
                isOpen={showLinkDialog}
                onClose={() => setShowLinkDialog(false)}
                onSubmit={insertLink}
              />
            </div>
          )}


          {/* Mention Dropdown */}
          {showMentionDropdown && (
            <MentionDropdown
              users={filteredUsers}
              selectedIndex={mentionSelectedIndex}
              onSelect={insertMention}
              position={mentionPosition}
            />
          )}



        </div>


        {/* Uploaded files section */}
        {uploadedFiles.length > 0 && (
          <div className="border-t border-border p-4" data-testid="uploaded-files-section">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Attachments ({uploadedFiles.length})
            </div>
            <div className="flex flex-wrap gap-3">
              {uploadedFiles.map((file) => (
                <FilePlaceholder
                  key={file.id}
                  file={file}
                  onRemove={removeFile}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
