import React, { useEffect, useState } from "react";
import { ACTION_NAME_PREFIX, type EnhancementType } from "@/schemas";
import { LoadingSpinnerIcon } from "@/components/Icons";

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
      onApply?: () => void;
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

export const Modal = () => {
  const [state, setState] = useState<ModalState>({ type: "closed" });

  useEffect(() => {
    const handleModalEvent = (event: CustomEvent) => {
      const { action, ...data } = event.detail;

      switch (action) {
        case `${ACTION_NAME_PREFIX}-modal-showLoading`:
          setState({
            type: "loading",
            enhancementType: data.enhancementType,
          });
          break;
        case `${ACTION_NAME_PREFIX}-modal-showResult`:
          setState({
            type: "result",
            enhancementType: data.enhancementType,
            originalText: data.originalText,
            enhancedText: data.enhancedText,
            onApply: data.onApply,
          });
          break;
        case `${ACTION_NAME_PREFIX}-modal-showError`:
          setState({
            type: "error",
            errorMessage: data.error || "An unknown error occurred",
          });
          break;
        case `${ACTION_NAME_PREFIX}-modal-close`:
          setState({ type: "closed" });
          break;
      }
    };

    window.addEventListener("ait-modal-event", handleModalEvent as EventListener);
    return () => {
      window.removeEventListener("ait-modal-event", handleModalEvent as EventListener);
    };
  }, []);

  const handleClose = () =>
    window.dispatchEvent(
      new CustomEvent("ait-modal-event", {
        detail: { action: `${ACTION_NAME_PREFIX}-modal-close` },
      })
    );

  if (state.type === "closed") return null;

  const renderContent = () => {
    switch (state.type) {
      case "loading":
        const { loading } = getActionTitle(state.enhancementType);
        return (
          <>
            <div className="ait-flex ait-items-center ait-justify-between ait-bg-gray-50 ait-px-6 ait-py-4">
              <div className="ait-flex ait-items-center ait-gap-3">
                <img
                  src={browser.runtime.getURL("icons/icon-48.png")}
                  alt="AiText"
                  className="ait-h-5 ait-w-5"
                />
                <div className="ait-text-lg ait-font-semibold ait-text-gray-800">{loading}</div>
              </div>
              <button
                className="ait-rounded-lg ait-bg-transparent ait-p-1 ait-text-gray-400 hover:ait-text-gray-600"
                onClick={handleClose}
              >
                <svg
                  className="ait-h-5 ait-w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="ait-flex ait-flex-col ait-items-center ait-p-12">
              <LoadingSpinnerIcon className="ait-h-8 ait-w-8" />
              <div className="ait-mt-2 ait-text-sm ait-text-gray-400">
                This might take a few seconds...
              </div>
            </div>
          </>
        );

      case "result":
        const { action } = getActionTitle(state.enhancementType);
        return (
          <>
            <div className="ait-flex ait-items-center ait-justify-between ait-bg-gray-50 ait-px-6 ait-py-4">
              <div className="ait-flex ait-items-center ait-gap-3">
                <img
                  src={browser.runtime.getURL("icons/icon-48.png")}
                  alt="AiText"
                  className="ait-h-5 ait-w-5"
                />
                <div className="ait-text-lg ait-font-semibold ait-text-gray-800">{action}</div>
              </div>
              <button
                className="ait-rounded-lg ait-p-1 ait-text-gray-400 ait-transition-colors hover:ait-bg-gray-100 hover:ait-text-gray-600"
                onClick={handleClose}
              >
                <svg
                  className="ait-h-5 ait-w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="ait-grid ait-min-h-0 ait-flex-1 ait-grid-cols-2 ait-divide-x ait-divide-gray-200">
              <div className="ait-flex ait-flex-col ait-overflow-hidden">
                <div className="ait-flex ait-shrink-0 ait-items-center ait-gap-2 ait-border-y ait-border-gray-200 ait-bg-gray-50/80 ait-px-6 ait-py-3">
                  <svg
                    className="ait-h-4 ait-w-4 ait-text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <h3 className="ait-font-medium ait-text-gray-700">Original</h3>
                </div>
                <div className="ait-grow ait-overflow-y-auto ait-px-6 ait-py-4">
                  <div className="ait-prose ait-prose-sm ait-mx-auto ait-max-w-[450px] ait-max-w-none ait-text-gray-600">
                    {state.originalText.split("\n").map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ait-flex ait-flex-col ait-overflow-hidden">
                <div className="ait-flex ait-shrink-0 ait-items-center ait-gap-2 ait-border-y ait-border-gray-200 ait-bg-gray-50/80 ait-px-6 ait-py-3">
                  <svg
                    className="ait-h-4 ait-w-4 ait-text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <h3 className="ait-font-medium ait-text-gray-700">Updated</h3>
                </div>
                <div className="ait-grow ait-overflow-y-auto ait-px-6 ait-py-4">
                  <div className="ait-prose ait-prose-sm ait-mx-auto ait-max-w-[450px] ait-max-w-none ait-text-gray-800">
                    {state.enhancedText.split("\n").map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {state.onApply ? (
              <div className="ait-flex ait-shrink-0 ait-justify-end ait-gap-3 ait-border-t ait-border-gray-200 ait-bg-gray-50 ait-px-6 ait-py-4">
                <button
                  className="ait-rounded-lg ait-border ait-border-gray-200 ait-bg-white ait-px-4 ait-py-2 ait-text-sm ait-font-medium ait-text-gray-700 ait-transition-colors hover:ait-border-gray-300 hover:ait-bg-gray-50 focus:ait-ring-2 focus:ait-ring-gray-200"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="focus:ait-ring-primary/50 ait-rounded-lg ait-bg-primary ait-px-4 ait-py-2 ait-text-sm ait-font-medium ait-text-white ait-transition-colors hover:ait-bg-primary-hover focus:ait-ring-2 focus:ait-ring-offset-2"
                  onClick={state.onApply}
                >
                  Apply Changes
                </button>
              </div>
            ) : null}
          </>
        );

      case "error":
        return (
          <>
            <div className="ait-flex ait-items-center ait-justify-between ait-bg-gray-50 ait-px-6 ait-py-4">
              <div className="ait-flex ait-items-center ait-gap-3">
                <img
                  src={browser.runtime.getURL("icons/icon-48.png")}
                  alt="AiText"
                  className="ait-h-5 ait-w-5"
                />
                <div className="ait-text-lg ait-font-semibold ait-text-gray-800">Error</div>
              </div>
              <button
                className="ait-rounded-lg ait-p-1 ait-text-gray-400 ait-transition-colors hover:ait-bg-gray-100 hover:ait-text-gray-600"
                onClick={handleClose}
              >
                <svg
                  className="ait-h-5 ait-w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="ait-p-6">
              <div className="ait-font-medium ait-text-red-600">{state.errorMessage}</div>
            </div>
          </>
        );
    }
  };

  return (
    <>
      <div className="ait-fixed ait-inset-0 ait-z-[10000] ait-flex ait-items-center ait-justify-center ait-bg-gray-900/75 ait-p-4 ait-backdrop-blur-sm">
        <div className="ait-modal-animate ait-flex ait-max-h-[80vh] ait-w-[80%] ait-min-w-[480px] ait-max-w-[800px] ait-flex-col ait-overflow-hidden ait-rounded-2xl ait-bg-gray-50 ait-shadow-2xl">
          {renderContent()}
        </div>
      </div>
    </>
  );
};
