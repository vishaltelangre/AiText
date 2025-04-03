import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import ReactDOM from "react-dom/client";
import { StorageDataSchema } from "@/schemas";
import { CrossIcon, LoadingSpinnerIcon, VisibilityEyeIcon } from "@/components/Icons";
import { callGeminiApi } from "@/data";

type AlertType = "success" | "error";
type LoadingType = "save-settings" | "test-api-key";

const Options = () => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<LoadingType | null>(null);

  useEffect(() => {
    const restoreSettings = async () => {
      try {
        const res = await browser.storage.sync.get("geminiApiKey");
        const { success, data, error } = StorageDataSchema.safeParse(res);
        if (!success) throw new Error(`Storage Error: ${error.message}`);
        if (data.geminiApiKey) {
          setApiKey(data.geminiApiKey.trim());
        }
      } catch (error) {
        console.error("Error loading options:", error);
      }
    };

    restoreSettings();

    // Set page title
    document.title = browser.runtime.getManifest().name;
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("save-settings");

    try {
      await browser.storage.sync.set({ geminiApiKey: apiKey.trim() });
      setAlert({ message: "Settings saved!", type: "success" });
    } catch (error) {
      setAlert({
        message: error instanceof Error ? error.message : "An error occurred while saving settings",
        type: "error",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const showAlert = (message: string, type: AlertType, autoHideTimeout = 5000) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    setAlert({ message, type });

    alertTimeoutRef.current = setTimeout(() => setAlert(null), autoHideTimeout);
  };

  const testApiKey = async () => {
    if (apiKey.length === 0) {
      showAlert("Please enter an API key first", "error");
      return;
    }

    setIsLoading("test-api-key");

    try {
      await callGeminiApi("Test", "Test", apiKey);
      showAlert("API key is valid!", "success");
    } catch (error) {
      if (error instanceof Error) {
        showAlert(error.message, "error");
      } else {
        showAlert("An error occurred while testing the API key", "error");
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="ait-root">
      <div className="ait-mx-auto ait-max-w-2xl ait-p-6">
        <form
          onSubmit={saveSettings}
          className="ait-rounded-lg ait-border ait-border-gray-200 ait-bg-white ait-shadow-sm"
        >
          <div className="ait-p-6">
            <div className="ait-space-y-4">
              <div>
                <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                  Gemini API Key
                </label>
                <div className="ait-relative ait-mt-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value.trim())}
                    placeholder="Enter your API key"
                    className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary disabled:ait-cursor-not-allowed disabled:ait-bg-gray-50 disabled:ait-text-gray-500"
                    disabled={isLoading !== null}
                  />
                  <div className="ait-absolute ait-right-0 ait-top-0 ait-flex ait-h-full ait-items-center ait-gap-0.5 ait-pr-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      title={showKey ? "Hide API key" : "Show API key"}
                      className="ait-inline-flex ait-items-center ait-rounded ait-p-1.5 ait-text-gray-400 ait-transition-colors hover:ait-text-[#000000] disabled:ait-cursor-not-allowed disabled:ait-opacity-50 disabled:hover:ait-text-gray-400"
                      disabled={isLoading !== null}
                    >
                      <VisibilityEyeIcon open={showKey} />
                    </button>
                    {apiKey.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setApiKey("")}
                        title="Clear API key"
                        className="ait-inline-flex ait-items-center ait-rounded ait-p-1.5 ait-text-gray-400 ait-transition-colors hover:ait-text-[#000000] disabled:ait-cursor-not-allowed disabled:ait-opacity-50 disabled:hover:ait-text-gray-400"
                        disabled={isLoading !== null}
                      >
                        <CrossIcon />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="ait-text-sm ait-text-gray-500">
                Your API key is stored locally on your device and is only used to make requests to
                the Gemini API.{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  className="ait-font-medium ait-text-primary hover:ait-text-primary-hover"
                >
                  Get API key →
                </a>
              </p>
            </div>
          </div>

          <div className="ait-rounded-b-lg ait-border-t ait-border-gray-200 ait-bg-gray-50 ait-px-6 ait-py-4">
            <div className="ait-flex ait-items-center ait-justify-between">
              <div
                className={clsx(
                  "ait-text-sm",
                  alert?.type === "success" ? "ait-text-green-600" : "ait-text-red-600"
                )}
              >
                {alert?.message}
              </div>
              <div className="ait-flex ait-gap-3">
                <button
                  type="submit"
                  className="ait-flex ait-flex-1 ait-items-center ait-justify-center ait-gap-2 ait-rounded-md ait-bg-primary ait-px-4 ait-py-2 ait-text-sm ait-font-medium ait-text-white hover:ait-bg-primary-hover disabled:ait-cursor-not-allowed disabled:ait-opacity-50"
                  disabled={isLoading !== null}
                >
                  <span>Save</span>
                  {isLoading === "save-settings" ? <LoadingSpinnerIcon /> : null}
                </button>
                <button
                  type="button"
                  onClick={testApiKey}
                  className="ait-flex ait-items-center ait-justify-center ait-gap-2 ait-rounded-md ait-bg-gray-100 ait-px-4 ait-py-2 ait-text-sm ait-font-medium ait-text-gray-700 hover:ait-bg-gray-200 disabled:ait-cursor-not-allowed disabled:ait-opacity-50"
                  disabled={isLoading !== null}
                >
                  <span>Test connectivity</span>
                  {isLoading === "test-api-key" ? <LoadingSpinnerIcon /> : null}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.createRoot(root).render(<Options />);
  }
});
