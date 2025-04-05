import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import ReactDOM from "react-dom/client";
import {
  type CustomContextMenuItem,
  AiProviderConfig,
  AiProvidersConfigs,
  AiProviderType,
} from "@/schemas";
import { CrossIcon, VisibilityEyeIcon, LockIcon } from "@/components/Icons";
import { createAiProvider } from "@/data";
import Button from "@/components/Button";
import {
  DEFAULT_AI_PROVIDERS_CONFIGS,
  DEFAULT_CONTEXT_MENU_ITEMS,
  STORAGE_KEYS,
} from "@/constants";
import { getAiProviderConfig, getStorageData, setStorageData } from "@/utils";

type AlertType = "success" | "error";
type LoadingType = "save-configs" | "test-api-connectivity";
type TabType = "api" | "menu";

const Options = () => {
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<LoadingType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("api");
  const [apiKey, setApiKey] = useState("");
  const [aiProvidersConfigs, setAiProvidersConfigs] = useState<AiProvidersConfigs>(
    DEFAULT_AI_PROVIDERS_CONFIGS
  );

  useEffect(() => {
    const restoreConfigs = async () => {
      const { success, data, error } = await getStorageData([STORAGE_KEYS.AI_PROVIDERS_CONFIGS]);
      if (!success) throw new Error(`Storage Error: ${error.message}`);

      const configs = data[STORAGE_KEYS.AI_PROVIDERS_CONFIGS];
      if (configs) setAiProvidersConfigs(configs);
    };

    restoreConfigs();

    // Set page's title
    document.title = `${browser.runtime.getManifest().name} - Settings`;
  }, []);

  const showAlert = (message: string, type: AlertType, autoHideTimeout = 5000) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    setAlert({ message, type });

    alertTimeoutRef.current = setTimeout(() => setAlert(null), autoHideTimeout);
  };

  const saveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("save-configs");

    try {
      await setStorageData({
        [STORAGE_KEYS.AI_PROVIDERS_CONFIGS]: aiProvidersConfigs,
      });

      showAlert("Settings saved!", "success");
    } catch (error) {
      showAlert(
        error instanceof Error ? error.message : "An error occurred while saving settings",
        "error"
      );
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="ait-root">
      <div className="ait-mx-auto ait-max-w-2xl ait-p-6">
        <div className="ait-space-y-6">
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setAlert(null);
            }}
          />

          {activeTab === "api" ? (
            <ApiSettingsTab
              apiKey={apiKey}
              setApiKey={setApiKey}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              showAlert={showAlert}
              aiProvidersConfigs={aiProvidersConfigs}
              setAiProvidersConfigs={setAiProvidersConfigs}
            />
          ) : (
            <ContextMenuItemsTab showAlert={showAlert} />
          )}

          <div className="ait-flex ait-items-center ait-justify-between ait-px-2 ait-py-1">
            <div
              className={clsx(
                "ait-text-sm",
                alert?.type === "success" ? "ait-text-green-600" : "ait-text-red-600"
              )}
            >
              {alert?.message}
            </div>
            {activeTab !== "menu" ? (
              <Button
                variant="primary"
                disabled={isLoading !== null}
                loading={isLoading === "save-configs"}
                onClick={saveConfigs}
              >
                Save
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

type TabButtonProps = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tab: TabType;
  label: string;
};
const TabButton = ({ activeTab, setActiveTab, tab, label }: TabButtonProps) => {
  return (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={clsx(
        "ait-whitespace-nowrap ait-border-b-2 ait-px-1 ait-py-4 ait-text-sm ait-font-medium",
        activeTab === tab
          ? "ait-border-primary ait-text-primary"
          : "ait-border-transparent ait-text-gray-500 hover:ait-border-gray-300 hover:ait-text-gray-700"
      )}
    >
      {label}
    </button>
  );
};

type TabNavigationProps = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

const TabNavigation = ({ activeTab, setActiveTab }: TabNavigationProps) => {
  return (
    <div className="ait-border-b ait-border-gray-200">
      <nav className="-ait-mb-px ait-flex ait-space-x-8" aria-label="Tabs">
        <TabButton
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tab="api"
          label="API settings"
        />
        <TabButton
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tab="menu"
          label="Context menu items"
        />
      </nav>
    </div>
  );
};

type ApiSettingsTabProps = {
  apiKey: string;
  setApiKey: (key: string) => void;
  isLoading: LoadingType | null;
  setIsLoading: (loading: LoadingType | null) => void;
  showAlert: (message: string, type: AlertType, autoHideTimeout?: number) => void;
  aiProvidersConfigs: AiProvidersConfigs;
  setAiProvidersConfigs: React.Dispatch<React.SetStateAction<AiProvidersConfigs>>;
};

const ApiSettingsTab = ({
  isLoading,
  setIsLoading,
  showAlert,
  aiProvidersConfigs,
  setAiProvidersConfigs,
}: ApiSettingsTabProps) => {
  const [showKey, setShowKey] = useState(false);

  const updateProviderConfig = (type: AiProviderType, config: Partial<AiProviderConfig>) => {
    setAiProvidersConfigs((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [type]: { ...prev.providers[type], ...config },
      },
    }));
  };

  const setActiveProvider = (type: AiProviderType) => {
    setAiProvidersConfigs((prev) => ({
      ...prev,
      activeProvider: type,
    }));
  };

  const testAiProviderConnectivity = async (type: AiProviderType) => {
    const config = aiProvidersConfigs.providers[type];
    if (!config) {
      showAlert("Provider settings not found", "error");
      return;
    }

    if (!config.apiKey) {
      showAlert("Please enter an API key first", "error");
      return;
    }

    if (!config.baseUrl) {
      showAlert("Base URL is required", "error");
      return;
    }

    setIsLoading("test-api-connectivity");

    const providerName = aiProvidersConfigs.providers[type]?.name ?? type;

    try {
      await createAiProvider(type, config).testConnectivity();
      showAlert(`Connection to ${providerName} works!`, "success");
    } catch (error) {
      if (error instanceof Error) {
        showAlert(error.message, "error");
      } else {
        showAlert(`Failed to connect to ${providerName}`, "error");
      }
    } finally {
      setIsLoading(null);
    }
  };

  const renderProviderSettings = (type: AiProviderType) => {
    const config = getAiProviderConfig(type, aiProvidersConfigs);
    const defaultConfig = DEFAULT_AI_PROVIDERS_CONFIGS.providers[type];

    return (
      <div className="ait-space-y-4">
        <div>
          <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
            API Key
          </label>
          <div className="ait-flex ait-items-center ait-gap-2">
            <div className="ait-relative ait-mt-1 ait-flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => updateProviderConfig(type, { apiKey: e.target.value.trim() })}
                placeholder="Enter your API key"
                className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
              />
              <div className="ait-absolute ait-right-1 ait-top-0 ait-flex ait-h-full ait-items-center">
                <Button
                  variant="icon"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? "Hide API key" : "Show API key"}
                >
                  <VisibilityEyeIcon open={showKey} />
                </Button>
                {config.apiKey && (
                  <Button
                    variant="icon"
                    onClick={() => updateProviderConfig(type, { apiKey: "" })}
                    title="Clear API key"
                  >
                    <CrossIcon />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="ait-mt-2 ait-text-sm ait-text-gray-500">
            Your API key is stored locally on your device and is only used to make requests to the{" "}
            {config.name} API.{" "}
            <a
              href={config.getApiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ait-font-medium ait-text-primary hover:ait-text-primary-hover"
            >
              Get API key →
            </a>
          </p>
        </div>

        <div>
          <div className="ait-flex ait-items-center ait-justify-between">
            <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
              Base URL
            </label>
            {config.baseUrl !== defaultConfig.baseUrl && (
              <Button
                variant="secondary"
                onClick={() => updateProviderConfig(type, { baseUrl: defaultConfig.baseUrl })}
                className="ait-bg-transparent ait-text-xs"
              >
                Reset to default
              </Button>
            )}
          </div>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => updateProviderConfig(type, { baseUrl: e.target.value.trim() })}
            placeholder={defaultConfig.baseUrl}
            className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
          />
        </div>

        <div>
          <div className="ait-flex ait-items-center ait-justify-between">
            <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
              Model
            </label>
            {config.model !== defaultConfig.model && (
              <Button
                variant="secondary"
                onClick={() => updateProviderConfig(type, { model: defaultConfig.model })}
                className="ait-bg-transparent ait-text-xs"
              >
                Reset to default
              </Button>
            )}
          </div>
          <input
            type="text"
            value={config.model}
            onChange={(e) => updateProviderConfig(type, { model: e.target.value.trim() })}
            placeholder={defaultConfig.model}
            className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
          />
        </div>

        <div className="ait-flex ait-justify-end">
          <Button
            variant="secondary"
            onClick={() => testAiProviderConnectivity(type)}
            disabled={isLoading !== null}
            loading={isLoading === "test-api-connectivity"}
          >
            Test connectivity
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="ait-rounded-lg ait-border ait-border-gray-200 ait-bg-white ait-shadow-sm">
      <div className="ait-p-6">
        <div className="ait-space-y-6">
          {(Object.keys(aiProvidersConfigs.providers) as AiProviderType[]).map((type) => (
            <div key={type} className="ait-space-y-4">
              <div className="ait-flex ait-items-center ait-justify-between">
                <div className="ait-flex ait-items-center ait-gap-2">
                  <button
                    onClick={() => setActiveProvider(type)}
                    className={clsx(
                      "duration-200 ease-in-out ait-relative ait-inline-flex ait-h-6 ait-w-11 ait-flex-shrink-0 ait-cursor-pointer ait-rounded-full ait-border-2 ait-border-transparent ait-transition-colors focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary focus:ait-ring-offset-2",
                      aiProvidersConfigs.activeProvider === type
                        ? "ait-bg-primary"
                        : "ait-bg-gray-200"
                    )}
                  >
                    <span
                      className={clsx(
                        "duration-200 ease-in-out ait-pointer-events-none ait-inline-block ait-h-5 ait-w-5 ait-transform ait-rounded-full ait-bg-white ait-shadow ait-ring-0 ait-transition",
                        aiProvidersConfigs.activeProvider === type
                          ? "ait-translate-x-5"
                          : "ait-translate-x-0"
                      )}
                    />
                  </button>
                  <span className="ait-text-sm ait-font-medium ait-text-gray-900">
                    {aiProvidersConfigs.providers[type]?.name ?? type}
                  </span>
                </div>
              </div>

              {aiProvidersConfigs.activeProvider === type && (
                <div className="ait-ml-8 ait-space-y-4">{renderProviderSettings(type)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ContextMenuItemsTab = ({
  showAlert,
}: {
  showAlert: (message: string, type: AlertType) => void;
}) => {
  const [items, setItems] = useState<CustomContextMenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<
    (CustomContextMenuItem & { index: number }) | null
  >(null);
  const [newItem, setNewItem] = useState<CustomContextMenuItem>({
    id: "",
    title: "",
    instruction: "",
  });

  useEffect(() => {
    const restoreContextMenuItems = async () => {
      const { success, data, error } = await getStorageData([
        STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS,
      ]);
      if (!success) throw new Error(`Storage Error: ${error.message}`);
      const items = data[STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS];
      if (items) setItems(items);
    };

    restoreContextMenuItems();
  }, []);

  const saveItems = async (items: CustomContextMenuItem[]) => {
    try {
      await setStorageData({
        [STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS]: items,
      });
      showAlert("Context menu items saved!", "success");
    } catch (error) {
      showAlert(
        error instanceof Error
          ? error.message
          : "An error occurred while saving context menu items",
        "error"
      );
    }
  };

  const setAndSaveItems = (items: CustomContextMenuItem[]) => {
    setItems(items);
    saveItems(items);
  };

  const addItem = () => {
    if (!newItem.title || !newItem.instruction) {
      return;
    }

    const id = newItem.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (items.some((item) => item.id === id)) {
      return;
    }

    setAndSaveItems([...items, { ...newItem, id }]);
    setNewItem({ id: "", title: "", instruction: "" });
  };

  const removeItem = (id: string) => {
    setAndSaveItems(items.filter((item) => item.id !== id));
  };

  const startEditingItem = (item: CustomContextMenuItem, index: number) => {
    setEditingItem({ ...item, index });
  };

  const saveEditingItem = () => {
    if (!editingItem) return;

    const newItems = [...items];
    newItems[editingItem.index] = editingItem;
    setAndSaveItems(newItems);
    setEditingItem(null);
  };

  return (
    <div className="ait-rounded-lg ait-border ait-border-gray-200 ait-bg-white ait-shadow-sm">
      <div className="ait-p-6">
        <div className="ait-space-y-6">
          {/* Default context menu items */}
          <div>
            <h3 className="ait-mb-2 ait-text-sm ait-font-medium ait-text-gray-700">
              Default items
            </h3>
            <div className="ait-space-y-3">
              {DEFAULT_CONTEXT_MENU_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="ait-flex ait-items-start ait-gap-4 ait-rounded-lg ait-border ait-border-gray-100 ait-bg-gray-50 ait-p-4"
                >
                  <div className="ait-flex-1">
                    <div className="ait-flex ait-items-center ait-gap-2">
                      <LockIcon />
                      <div className="ait-font-medium ait-text-gray-700">{item.title}</div>
                    </div>
                    <div className="ait-mt-1 ait-text-sm ait-text-gray-500">{item.instruction}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom context menu items */}
          <div>
            <h3 className="ait-mb-2 ait-text-sm ait-font-medium ait-text-gray-700">Custom items</h3>
            <div className="ait-space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="ait-flex ait-items-start ait-gap-4 ait-rounded-lg ait-border ait-border-gray-200 ait-p-4"
                >
                  {editingItem?.id === item.id ? (
                    <div className="ait-flex-1 ait-space-y-3">
                      <div>
                        <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editingItem.title}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              title: e.target.value,
                            })
                          }
                          className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
                        />
                      </div>
                      <div>
                        <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                          Instruction
                        </label>
                        <textarea
                          value={editingItem.instruction}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              instruction: e.target.value,
                            })
                          }
                          rows={3}
                          className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
                        />
                      </div>
                      <div className="ait-flex ait-justify-end ait-gap-2">
                        <Button variant="secondary" onClick={() => setEditingItem(null)}>
                          Cancel
                        </Button>
                        <Button variant="primary" onClick={saveEditingItem}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="ait-flex-1">
                        <div className="ait-font-medium ait-text-gray-700">{item.title}</div>
                        <div className="ait-mt-1 ait-text-sm ait-text-gray-500">
                          {item.instruction}
                        </div>
                      </div>
                      <div className="ait-flex ait-gap-2">
                        <Button variant="secondary" onClick={() => startEditingItem(item, index)}>
                          Edit
                        </Button>
                        <Button variant="secondary" onClick={() => removeItem(item.id)}>
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new context menu item */}
              <div className="ait-space-y-3 ait-rounded-lg ait-border ait-border-gray-200 ait-p-4">
                <div>
                  <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Translate to Spanish"
                    className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
                  />
                </div>
                <div>
                  <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                    Instruction
                  </label>
                  <textarea
                    value={newItem.instruction}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        instruction: e.target.value,
                      })
                    }
                    placeholder="e.g., Translate the given text to Spanish. Keep the meaning intact and use appropriate Spanish words."
                    rows={3}
                    className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
                  />
                </div>
                <div className="ait-flex ait-justify-end">
                  <Button
                    variant="secondary"
                    onClick={addItem}
                    disabled={!newItem.title || !newItem.instruction}
                  >
                    Add item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
