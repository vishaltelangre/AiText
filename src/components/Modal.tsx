import React, { useEffect, useState } from "react";
import { type EnhancementType, ACTIONS, MODAL_EVENT_NAME } from "@/constants";
import {
  CrossIcon,
  LoadingSpinnerIcon,
  PencilIcon,
  SparklesIcon,
  ClipboardIcon,
} from "@/components/Icons";
import { MessageSchema } from "@/schemas";
import { dispatchModalEvent } from "@/utils";

type ModalState =
  | { type: "closed" }
  | {
      type: "loading";
      enhancementType: EnhancementType;
    }
  | {
      type: "result";
      enhancementType: EnhancementType;
      originalText: string;
      enhancedText: string;
      onReplace?: () => void;
    }
  | {
      type: "error";
      errorMessage: string;
    };

const getActionTitle = (type: EnhancementType): { action: string; loading: string } => {
  const titles: Record<EnhancementType, { action: string; loading: string }> = {
    fixGrammar: {
      action: "Enhanced with grammar fix",
      loading: "Fixing grammar",
    },
    rephraseSentence: {
      action: "Rephrased",
      loading: "Rephrasing sentence",
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

  return titles[type] || { action: "Enhanced", loading: "Enhancing text" };
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
      <div className="ait-flex ait-items-center ait-justify-between ait-bg-gray-50 ait-px-6 ait-py-4">
        <div className="ait-flex ait-items-center ait-gap-3">
          <img
            src={browser.runtime.getURL("icons/icon-128.png")}
            alt={browser.runtime.getManifest().name}
            className="ait-h-6 ait-w-6"
          />
          <div className="ait-text-lg ait-font-semibold ait-text-gray-800">{title}</div>
        </div>
        <button
          className="ait-rounded-lg ait-p-1 ait-text-gray-400 ait-transition-colors hover:ait-text-gray-600"
          onClick={onClose}
          title="Close"
        >
          <CrossIcon />
        </button>
      </div>
      <div className="ait-flex ait-min-h-0 ait-flex-1 ait-flex-col ait-overflow-hidden">
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
  enhancementType: EnhancementType;
  onClose: () => void;
};

const LoadingModal = ({ enhancementType, onClose }: LoadingModalProps) => {
  const { loading } = getActionTitle(enhancementType);
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
      <button
        onClick={() => void handleCopy()}
        className="ait-rounded ait-p-1 ait-text-gray-400 hover:ait-bg-gray-100 hover:ait-text-gray-600"
        title="Copy to clipboard"
      >
        <ClipboardIcon />
      </button>
    </div>
  );
};

type ResultModalProps = {
  enhancementType: EnhancementType;
  originalText: string;
  enhancedText: string;
  onReplace?: () => void;
  onClose: () => void;
};

const ResultModal = ({
  enhancementType,
  originalText,
  enhancedText,
  onReplace,
  onClose,
}: ResultModalProps) => {
  const { action } = getActionTitle(enhancementType);

  return (
    <ModalLayout
      title={action}
      onClose={onClose}
      footer={
        onReplace ? (
          <button
            className="focus:ait-ring-primary/50 ait-rounded-lg ait-bg-primary ait-px-4 ait-py-2 ait-text-sm ait-font-medium ait-text-white ait-transition-colors hover:ait-bg-primary-hover focus:ait-ring-2 focus:ait-ring-offset-2"
            onClick={onReplace}
          >
            Replace
          </button>
        ) : undefined
      }
    >
      <div className="ait-grid ait-min-h-0 ait-flex-1 ait-grid-cols-2 ait-divide-x ait-divide-gray-200">
        <div className="ait-flex ait-flex-col ait-overflow-hidden">
          <div className="ait-flex ait-h-12 ait-shrink-0 ait-items-center ait-border-y ait-border-gray-200 ait-bg-gray-50/50 ait-px-6">
            <div className="ait-flex ait-flex-1 ait-items-center ait-gap-2">
              <PencilIcon />
              <h3 className="ait-font-medium ait-text-gray-700">Original</h3>
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
              <h3 className="ait-font-medium ait-text-gray-700">Updated</h3>
            </div>
            <CopyToClipboard text={enhancedText} />
          </div>
          <div className="ait-grow ait-overflow-y-auto ait-bg-white ait-px-6 ait-py-4">
            <div className="ait-prose ait-prose-sm ait-mx-auto ait-max-w-[450px] ait-max-w-none ait-text-gray-800">
              {enhancedText.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
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
    <ModalLayout title="Error" onClose={onClose}>
      <div className="ait-p-6">
        <div className="ait-font-medium ait-text-red-600">{errorMessage}</div>
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
          enhancementType: data.enhancementType,
        });
      } else if (data.action === ACTIONS.MODAL_SHOW_ENHANCED_TEXT) {
        setState({
          type: "result",
          enhancementType: data.enhancementType,
          originalText: data.originalText,
          enhancedText: data.enhancedText,
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

  if (state.type === "closed") return null;

  return (
    <>
      <div className="ait-fixed ait-inset-0 ait-z-[10000] ait-flex ait-items-center ait-justify-center ait-bg-gray-900/75 ait-p-4 ait-backdrop-blur-sm">
        <div className="ait-modal-animate ait-flex ait-max-h-[80vh] ait-w-[80%] ait-min-w-[480px] ait-max-w-[800px] ait-flex-col ait-overflow-hidden ait-rounded-2xl ait-bg-gray-50 ait-shadow-2xl">
          {state.type === "loading" ? (
            <LoadingModal enhancementType={state.enhancementType} onClose={handleClose} />
          ) : state.type === "result" ? (
            <ResultModal
              enhancementType={state.enhancementType}
              originalText={state.originalText}
              enhancedText={state.enhancedText}
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
