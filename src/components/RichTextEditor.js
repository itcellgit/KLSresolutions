import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./RichTextEditor.css";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
  style = { height: "150px" },
  required = false,
}) => {
  // Custom toolbar configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "color",
    "background",
  ];

  // Simplified styling with CSS custom properties
  const heightValue = parseInt(style.height) || 150;
  const containerStyle = {
    "--editor-height": `${heightValue}px`,
  };

  return (
    <div
      className={`rich-text-editor form-field ${className}`}
      style={containerStyle}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default RichTextEditor;
