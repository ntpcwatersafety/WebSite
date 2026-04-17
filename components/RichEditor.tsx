import React, { useId } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const TINYMCE_API_KEY = 'r5if44rv4x9bo1fan9i5rj3wyy782zuqkqd4lkhkomddqngo';

const EDITOR_INIT = {
  language: 'zh-TW',
  menubar: false,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image',
    'charmap', 'searchreplace', 'visualblocks', 'code',
    'insertdatetime', 'table', 'wordcount'
  ],
  toolbar:
    'undo redo | ' +
    'bold italic underline strikethrough | ' +
    'forecolor backcolor | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist | outdent indent | ' +
    'link image | ' +
    'table | ' +
    'removeformat code',
  toolbar_sticky: true,
  content_style: 'body { font-family: "Noto Sans TC", sans-serif; font-size: 15px; line-height: 1.8; }',
  link_default_target: '_blank',
  image_advtab: true,
};

interface RichEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  onImageUpload?: (blobInfo: any, success: (url: string) => void, failure: (err: string) => void) => void;
}

const RichEditor: React.FC<RichEditorProps> = ({ value, onChange, height = 300, onImageUpload }) => {
  const id = useId().replace(/:/g, '-');
  return (
    <Editor
      id={`tinymce-${id}`}
      apiKey={TINYMCE_API_KEY}
      value={typeof value === 'string' ? value : ''}
      onEditorChange={(content) => onChange(typeof content === 'string' ? content : '')}
      init={{
        ...EDITOR_INIT,
        height,
        images_upload_handler: onImageUpload,
      }}
    />
  );
};

export default RichEditor;
