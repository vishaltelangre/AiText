import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { CheckIcon, SettingsIcon, RadioIcon } from "@/components/Icons";
import Button from "@/components/Button";
import { STORAGE_KEYS } from "@/constants";
import { getStorageData } from "@/utils";
import { AiProvidersConfigs } from "@/schemas";

const Popup = () => {
  const [aiProvidersConfigs, setAiProvidersConfigs] = useState<AiProvidersConfigs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { success, data } = await getStorageData([STORAGE_KEYS.AI_PROVIDERS_CONFIGS]);
        if (!success) throw new Error("Failed to fetch AI provider data");
        const configs = data[STORAGE_KEYS.AI_PROVIDERS_CONFIGS];
        setAiProvidersConfigs(configs || null);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to fetch AI provider data");
        }
      }
    };

    fetchConfigs();
  }, []);

  useEffect(() => {
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

        <div className="ait-mt-4 ait-space-y-4 ait-rounded-lg ait-border ait-border-gray-200 ait-p-4">
          {aiProvidersConfigs ? (
            <div className="ait-space-y-3">
              <h2 className="ait-text-xs ait-font-semibold ait-uppercase ait-text-gray-400">
                Active AI provider
              </h2>

              <div className="ait-bg-green-50 ait-px-4 ait-py-3">
                <div className="ait-flex ait-items-center ait-gap-2">
                  <div className="ait-text-green-500">
                    <CheckIcon />
                  </div>
                  <div>
                    <div className="ait-font-medium ait-text-gray-900">
                      {aiProvidersConfigs.providers[aiProvidersConfigs.activeProvider]?.name}
                    </div>
                    <div className="ait-mt-1 ait-text-xs ait-text-gray-500">
                      {aiProvidersConfigs.providers[aiProvidersConfigs.activeProvider]?.model}
                    </div>
                    {aiProvidersConfigs.providers[aiProvidersConfigs.activeProvider]?.apiKey ? (
                      <div className="ait-mt-1.5 ait-text-sm ait-font-medium ait-text-green-600">
                        API key is set
                      </div>
                    ) : (
                      <div className="ait-mt-1.5 ait-text-sm ait-font-medium ait-text-red-600">
                        API key is not set
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="ait-text-xs ait-font-semibold ait-uppercase ait-text-gray-400">
                Other AI providers
              </h2>

              {Object.entries(aiProvidersConfigs.providers)
                .filter(([type]) => type !== aiProvidersConfigs.activeProvider)
                .map(([type, config]) => (
                  <div
                    key={type}
                    className="ait-bg-gray-50 ait-px-4 ait-py-3 ait-text-gray-400 ait-opacity-50"
                  >
                    <div className="ait-flex ait-items-center ait-gap-2">
                      <RadioIcon />

                      <span className="ait-text-lg">{config.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="ait-text-center ait-text-gray-500">
              {error ? error : "No AI providers found"}
            </div>
          )}
        </div>

        <div className="ait-mt-6 ait-flex ait-justify-end">
          <Button
            variant="secondary"
            title="Open settings"
            onClick={() => browser.runtime.openOptionsPage()}
            className="ait-flex ait-items-center ait-gap-2 ait-bg-gray-50 ait-text-gray-700"
          >
            <SettingsIcon />
            <span className="ait-text-base">Settings</span>
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
