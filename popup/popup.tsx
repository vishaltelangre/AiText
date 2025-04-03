import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { clsx } from "clsx";
import { StorageDataSchema } from "@/schemas";
import { CheckIcon, CrossIcon, SettingsIcon } from "@/components/Icons";
import Button from "@/components/Button";

type ApiKeyStatus = {
  hasKey: boolean;
  error: string | null;
};

const Popup = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
    hasKey: false,
    error: null,
  });

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const res = await browser.storage.sync.get("geminiApiKey");
        const { success, data, error } = StorageDataSchema.safeParse(res);
        if (!success) throw new Error(error.message);
        setApiKeyStatus({ hasKey: !!data.geminiApiKey, error: null });
      } catch (error) {
        setApiKeyStatus({
          hasKey: false,
          error: error instanceof Error ? error.message : "Failed to check API key",
        });
      }
    };

    checkApiKey();

    // Set page title
    document.title = browser.runtime.getManifest().name;
  }, []);

  return (
    <div className="ait-root">
      <div className="ait-w-[320px] ait-p-4">
        <div className="ait-flex ait-items-center ait-gap-3">
          <img
            src={browser.runtime.getURL("icons/icon-128.png")}
            alt={browser.runtime.getManifest().name}
            className="ait-h-8 ait-w-8"
          />
          <div>
            <h1 className="ait-text-lg ait-font-semibold ait-text-gray-800">
              {browser.runtime.getManifest().name}
            </h1>
            <small className="ait-text-sm ait-text-gray-500">
              {browser.runtime.getManifest().description}
            </small>
          </div>
        </div>

        <div
          className={clsx(
            "ait-mt-4 ait-flex ait-items-center ait-justify-between ait-rounded-lg ait-border ait-px-4 ait-py-2.5",
            apiKeyStatus.hasKey
              ? "ait-border-green-100 ait-bg-green-50"
              : "ait-border-red-200 ait-bg-red-100/50"
          )}
        >
          <div
            className={clsx(
              "ait-flex ait-items-center ait-gap-0.5",
              apiKeyStatus.hasKey ? "ait-text-green-600" : "ait-text-red-600"
            )}
          >
            {apiKeyStatus.hasKey ? <CheckIcon /> : <CrossIcon />}
            <span className="ait-text-sm">
              {apiKeyStatus.hasKey ? "API key is set" : apiKeyStatus.error || "API key is not set"}
            </span>
          </div>

          <Button
            variant="icon"
            title="Check settings"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            <SettingsIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.createRoot(root).render(<Popup />);
  }
});
