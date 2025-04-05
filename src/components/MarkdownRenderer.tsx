import React, { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import clsx from "clsx";

marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

// Configure DOMPurify options
const purifyConfig = {
  ALLOWED_TAGS: [
    // Block elements
    "p",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "pre",
    "code",
    // Inline elements
    "b",
    "i",
    "strong",
    "em",
    "strike",
    "s",
    "del",
    // Lists
    "ul",
    "ol",
    "li",
    // Other
    "a",
    "br",
    "hr",
    // Tables
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"], // Only needed for links
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ["target"], // For adding target="_blank" to links
  FORBID_TAGS: ["style", "script", "iframe"],
  FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  RETURN_DOM: true, // Return a DOM object instead of HTML string
  RETURN_DOM_FRAGMENT: true, // Return a DocumentFragment
} as DOMPurify.Config;

// Add hook to handle links
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

// Convert DOM nodes to React elements
function domToReact(node: Node): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    // Create props object from attributes
    const props: { [key: string]: string } = {};
    Array.from(element.attributes).forEach((attr) => {
      props[attr.name] = attr.value;
    });

    // Convert children
    const children = Array.from(element.childNodes).map((child, index) => (
      <React.Fragment key={index}>{domToReact(child)}</React.Fragment>
    ));

    // Create the React element
    return React.createElement(tagName, { ...props, key: Math.random() }, children);
  }

  return null;
}

export const MarkdownRenderer = ({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) => {
  const sanitizedContent = useMemo(() => {
    try {
      const htmlContent = marked.parse(content, { async: false });
      const cleanDom = DOMPurify.sanitize(htmlContent, purifyConfig);
      // Type assertion since we know our config returns DocumentFragment
      const fragment = cleanDom as unknown as DocumentFragment;
      return Array.from(fragment.childNodes).map((node, index) => (
        <React.Fragment key={index}>{domToReact(node)}</React.Fragment>
      ));
    } catch (error) {
      console.error("Error rendering markdown:", error);
      return ["Error rendering text"];
    }
  }, [content]);

  return <div className={clsx("ait-markdown-content", className)}>{sanitizedContent}</div>;
};

// This dummy div ensures Tailwind includes all custom styles from input.css for all possible markdown elements
const _dummyForTailwind = (
  <div className="ait-markdown-content">
    <h1 />
    <h2 />
    <h3 />
    <p />
    <ul>
      <li>
        <ul />
      </li>
    </ul>
    <ol>
      <li>
        <ol />
      </li>
    </ol>
    <a />
    <blockquote />
    <code />
    <pre>
      <code />
    </pre>
    <table>
      <th />
      <td />
    </table>
    <hr />
  </div>
);
