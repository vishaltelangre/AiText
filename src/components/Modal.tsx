import React, { useEffect, useState } from "react";
import {
  ACTIONS,
  MODAL_EVENT_NAME,
  DEFAULT_INSTRUCTION_TYPES,
  DefaultInstructionType,
} from "@/constants";
import {
  CrossIcon,
  LoadingSpinnerIcon,
  PencilIcon,
  SparklesIcon,
  ClipboardIcon,
  SettingsIcon,
} from "@/components/Icons";
import { MessageSchema, type InstructionType } from "@/schemas";
import { dispatchModalEvent } from "@/utils";
import { Button } from "@/components/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type ModalState =
  | { type: "closed" }
  | {
      type: "loading";
      instructionType: InstructionType;
      operation: string;
    }
  | {
      type: "result";
      instructionType: InstructionType;
      operation: string;
      originalText: string;
      result: string;
      onReplace?: () => void;
    }
  | {
      type: "error";
      errorMessage: string;
    };

function isDefaultInstructionType(type: InstructionType): type is DefaultInstructionType {
  return DEFAULT_INSTRUCTION_TYPES.includes(type as DefaultInstructionType);
}

const getActionTitle = (
  type: InstructionType,
  operation: string
): { action: string; loading: string } => {
  const defaultTitles: Record<DefaultInstructionType, { action: string; loading: string }> = {
    fixGrammar: {
      action: "Enhanced with grammar fix",
      loading: "Fixing grammar",
    },
    rephrase: {
      action: "Rephrased",
      loading: "Rephrasing text",
    },
    formalize: {
      action: "Formalized",
      loading: "Formalizing text",
    },
    simplify: {
      action: "Simplified",
      loading: "Simplifying text",
    },
    summarize: {
      action: "Summarized",
      loading: "Summarizing text",
    },
  };

  // Check if it's a default instruction type
  if (isDefaultInstructionType(type)) return defaultTitles[type];

  // For custom instruction types, use a generic title
  return {
    action: `"${operation}" result`,
    loading: `Performing "${operation}"`,
  };
};

type ModalLayoutProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const ModalLayout = ({ title, onClose, children, footer }: ModalLayoutProps) => {
  return (
    <>
      <div className="ait-flex ait-items-center ait-justify-between ait-border-b ait-border-gray-200 ait-bg-gray-50 ait-px-6 ait-py-4">
        <div className="ait-flex ait-items-center ait-gap-3">
          <img
            src={browser.runtime.getURL("icons/icon-128.png")}
            alt={browser.runtime.getManifest().name}
            className="ait-h-6 ait-w-6"
          />
          <div className="ait-text-lg ait-font-semibold ait-text-gray-800">{title}</div>
        </div>
        <Button variant="icon" onClick={onClose} title="Close">
          <CrossIcon />
        </Button>
      </div>
      <div className="ait-flex ait-min-h-0 ait-flex-1 ait-flex-col ait-overflow-hidden ait-bg-white">
        {children}
      </div>
      {footer && (
        <div className="ait-flex ait-shrink-0 ait-justify-end ait-gap-3 ait-border-t ait-border-gray-200 ait-bg-gray-50 ait-px-6 ait-py-4">
          {footer}
        </div>
      )}
    </>
  );
};

type LoadingModalProps = {
  instructionType: InstructionType;
  operation: string;
  onClose: () => void;
};

const LoadingModal = ({ instructionType, operation, onClose }: LoadingModalProps) => {
  const { loading } = getActionTitle(instructionType, operation);
  return (
    <ModalLayout title={loading} onClose={onClose}>
      <div className="ait-flex ait-flex-col ait-items-center ait-p-12">
        <LoadingSpinnerIcon className="ait-h-8 ait-w-8" />
        <div className="ait-mt-2 ait-text-sm ait-text-gray-400">
          This might take a few seconds...
        </div>
      </div>
    </ModalLayout>
  );
};

const CopyToClipboard = ({ text }: { text: string }) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="ait-flex ait-items-center ait-gap-2">
      {showCopied && <span className="ait-text-sm ait-text-gray-500">Copied!</span>}
      <Button variant="icon" onClick={() => void handleCopy()} title="Copy to clipboard">
        <ClipboardIcon />
      </Button>
    </div>
  );
};

type ResultModalProps = {
  instructionType: InstructionType;
  operation: string;
  originalText: string;
  result: string;
  onReplace?: () => void;
  onClose: () => void;
};

const ResultModal = ({
  instructionType,
  operation,
  originalText,
  result,
  onReplace,
  onClose,
}: ResultModalProps) => {
  const { action } = getActionTitle(instructionType, operation);

  return (
    <ModalLayout
      title={action}
      onClose={onClose}
      footer={
        onReplace ? (
          <Button variant="primary" onClick={onReplace}>
            Replace
          </Button>
        ) : undefined
      }
    >
      <div className="ait-grid ait-min-h-0 ait-flex-1 ait-grid-cols-2 ait-divide-x ait-divide-gray-200">
        <div className="ait-flex ait-flex-col ait-overflow-hidden">
          <div className="ait-flex ait-h-12 ait-shrink-0 ait-items-center ait-border-y ait-border-gray-200 ait-bg-gray-50/50 ait-px-6">
            <div className="ait-flex ait-flex-1 ait-items-center ait-gap-2">
              <PencilIcon />
              <h3 className="ait-font-medium ait-text-gray-700">Selected text</h3>
            </div>
          </div>
          <div className="ait-grow ait-overflow-y-auto ait-bg-white ait-px-6 ait-py-4">
            <div className="ait-prose ait-prose-sm ait-mx-auto ait-max-w-[450px] ait-max-w-none ait-text-gray-600">
              {originalText.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="ait-flex ait-flex-col ait-overflow-hidden">
          <div className="ait-flex ait-h-12 ait-shrink-0 ait-items-center ait-border-y ait-border-gray-200 ait-bg-gray-50/50 ait-px-6">
            <div className="ait-flex ait-flex-1 ait-items-center ait-gap-2">
              <SparklesIcon />
              <h3 className="ait-font-medium ait-text-gray-700">Result</h3>
            </div>
            <CopyToClipboard text={result} />
          </div>
          <div className="ait-grow ait-overflow-y-auto ait-bg-white ait-px-6 ait-py-4">
            <div className="ait-prose ait-prose-sm ait-mx-auto ait-max-w-[450px] ait-max-w-none ait-text-gray-800">
              <MarkdownRenderer content={result} />
            </div>
          </div>
        </div>
      </div>
    </ModalLayout>
  );
};

type ErrorModalProps = {
  errorMessage: string;
  onClose: () => void;
};

const ErrorModal = ({ errorMessage, onClose }: ErrorModalProps) => {
  return (
    <ModalLayout
      title="Error"
      onClose={onClose}
      footer={
        <Button
          variant="secondary"
          onClick={() => dispatchModalEvent({ action: ACTIONS.OPEN_SETTINGS_PAGE })}
        >
          <SettingsIcon />
          Check settings
        </Button>
      }
    >
      <div className="ait-flex ait-flex-col ait-p-6">
        <div className="ait-text-red-600">{errorMessage}</div>
      </div>
    </ModalLayout>
  );
};

export const Modal = () => {
  const [state, setState] = useState<ModalState>({ type: "closed" });

  useEffect(() => {
    const handleModalEvent = (event: CustomEvent) => {
      const { success, data } = MessageSchema.safeParse(event.detail);
      if (!success) return;

      if (data.action === ACTIONS.MODAL_SHOW_LOADING) {
        setState({
          type: "loading",
          instructionType: data.instructionType,
          operation: data.operation,
        });
      } else if (data.action === ACTIONS.MODAL_SHOW_PROCESSED_TEXT) {
        setState({
          type: "result",
          instructionType: data.instructionType,
          operation: data.operation,
          originalText: data.originalText,
          result: data.result,
          onReplace: data.onReplace,
        });
      } else if (data.action === ACTIONS.MODAL_SHOW_ERROR) {
        setState({
          type: "error",
          errorMessage: data.error || "An unknown error occurred",
        });
      } else if (data.action === ACTIONS.MODAL_CLOSE) {
        setState({ type: "closed" });
      }
    };

    window.addEventListener(MODAL_EVENT_NAME, handleModalEvent as EventListener);
    return () => {
      window.removeEventListener(MODAL_EVENT_NAME, handleModalEvent as EventListener);
    };
  }, []);

  const handleClose = () => dispatchModalEvent({ action: ACTIONS.MODAL_CLOSE });

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  if (state.type === "closed") return null;

  return (
    <>
      <div
        className="ait-fixed ait-inset-0 ait-z-[10000] ait-flex ait-items-center ait-justify-center ait-bg-gray-900/75 ait-p-4 ait-backdrop-blur-sm"
        onClick={(e) => {
          // Only close if clicking directly on the backdrop (not on modal content)
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="ait-modal-animate ait-flex ait-max-h-[80vh] ait-w-[80%] ait-min-w-[480px] ait-max-w-[800px] ait-flex-col ait-overflow-hidden ait-rounded-2xl ait-bg-gray-50 ait-shadow-2xl">
          {state.type === "loading" ? (
            <LoadingModal
              instructionType={state.instructionType}
              operation={state.operation}
              onClose={handleClose}
            />
          ) : state.type === "result" ? (
            <ResultModal
              instructionType={state.instructionType}
              operation={state.operation}
              originalText={state.originalText}
              result={state.result}
              onReplace={state.onReplace}
              onClose={handleClose}
            />
          ) : state.type === "error" ? (
            <ErrorModal errorMessage={state.errorMessage} onClose={handleClose} />
          ) : null}
        </div>
      </div>
    </>
  );
};
