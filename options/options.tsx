import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import ReactDOM from "react-dom/client";
import { StorageDataSchema, type CustomContextMenuItem } from "@/schemas";
import { CrossIcon, VisibilityEyeIcon, LockIcon } from "@/components/Icons";
import { callGeminiApi } from "@/data";
import Button from "@/components/Button";
import { defaultContextMenuItems } from "@/constants";

type AlertType = "success" | "error";
type LoadingType = "save-settings" | "test-api-key";
type TabType = "api" | "menu";

const Options = () => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<LoadingType | null>(null);
  const [customContextMenuItems, setCustomContextMenuItems] = useState<CustomContextMenuItem[]>([]);
  const [editingContextMenuItem, setEditingContextMenuItem] = useState<
    (CustomContextMenuItem & { index: number }) | null
  >(null);
  const [newContextMenuItem, setNewContextMenuItem] = useState<CustomContextMenuItem>({
    id: "",
    title: "",
    instruction: "",
  });
  const [activeTab, setActiveTab] = useState<TabType>("api");

  useEffect(() => {
    const restoreSettings = async () => {
      try {
        const res = await browser.storage.sync.get(["geminiApiKey", "customContextMenuItems"]);
        const { success, data, error } = StorageDataSchema.safeParse(res);
        if (!success) throw new Error(`Storage Error: ${error.message}`);
        if (data.geminiApiKey) {
          setApiKey(data.geminiApiKey.trim());
        }
        if (data.customContextMenuItems) {
          setCustomContextMenuItems(data.customContextMenuItems);
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
      await browser.storage.sync.set({
        geminiApiKey: apiKey.trim(),
        customContextMenuItems,
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

  const addContextMenuItem = () => {
    if (!newContextMenuItem.title || !newContextMenuItem.instruction) {
      showAlert("Please fill in all fields", "error");
      return;
    }

    const id = newContextMenuItem.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (customContextMenuItems.some((item) => item.id === id)) {
      showAlert("A menu item with this title already exists", "error");
      return;
    }

    setCustomContextMenuItems([...customContextMenuItems, { ...newContextMenuItem, id }]);
    setNewContextMenuItem({ id: "", title: "", instruction: "" });
  };

  const removeContextMenuItem = (id: string) => {
    setCustomContextMenuItems(customContextMenuItems.filter((item) => item.id !== id));
  };

  const startEditingContextMenuItem = (item: CustomContextMenuItem, index: number) => {
    setEditingContextMenuItem({ ...item, index });
  };

  const saveEditingContextMenuItem = () => {
    if (!editingContextMenuItem) return;

    const newItems = [...customContextMenuItems];
    newItems[editingContextMenuItem.index] = editingContextMenuItem;
    setCustomContextMenuItems(newItems);
    setEditingContextMenuItem(null);
  };

  return (
    <div className="ait-root">
      <div className="ait-mx-auto ait-max-w-2xl ait-p-6">
        <form onSubmit={saveSettings} className="ait-space-y-6">
          {/* Tabs */}
          <div className="ait-border-b ait-border-gray-200">
            <nav className="-ait-mb-px ait-flex ait-space-x-8" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab("api")}
                className={clsx(
                  "ait-whitespace-nowrap ait-border-b-2 ait-px-1 ait-py-4 ait-text-sm ait-font-medium",
                  activeTab === "api"
                    ? "ait-border-primary ait-text-primary"
                    : "ait-border-transparent ait-text-gray-500 hover:ait-border-gray-300 hover:ait-text-gray-700"
                )}
              >
                API settings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("menu")}
                className={clsx(
                  "ait-whitespace-nowrap ait-border-b-2 ait-px-1 ait-py-4 ait-text-sm ait-font-medium",
                  activeTab === "menu"
                    ? "ait-border-primary ait-text-primary"
                    : "ait-border-transparent ait-text-gray-500 hover:ait-border-gray-300 hover:ait-text-gray-700"
                )}
              >
                Context menu items
              </button>
            </nav>
          </div>

          {/* API settings tab */}
          {activeTab === "api" && (
            <div className="ait-rounded-lg ait-border ait-border-gray-200 ait-bg-white ait-shadow-sm">
              <div className="ait-p-6">
                <div>
                  <div className="ait-flex ait-items-center ait-justify-between ait-gap-4">
                    <div className="ait-flex-1">
                      <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                        Gemini API Key
                      </label>
                      <div className="ait-flex ait-items-center ait-gap-2">
                        <div className="ait-relative ait-mt-1 ait-flex-1">
                          <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value.trim())}
                            placeholder="Enter your API key"
                            className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary disabled:ait-cursor-not-allowed disabled:ait-bg-gray-50 disabled:ait-text-gray-500"
                            disabled={isLoading !== null}
                          />
                          <div className="ait-absolute ait-right-1 ait-top-0 ait-flex ait-h-full ait-items-center">
                            <Button
                              variant="icon"
                              onClick={() => setShowKey(!showKey)}
                              title={showKey ? "Hide API key" : "Show API key"}
                            >
                              <VisibilityEyeIcon open={showKey} />
                            </Button>
                            {apiKey.length > 0 ? (
                              <Button
                                variant="icon"
                                onClick={() => setApiKey("")}
                                disabled={isLoading !== null}
                                title="Clear API key"
                              >
                                <CrossIcon />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={testApiKey}
                          disabled={isLoading !== null}
                          loading={isLoading === "test-api-key"}
                        >
                          Test connectivity
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="ait-mt-2 ait-text-sm ait-text-gray-500">
                    Your API key is stored locally on your device and is only used to make requests
                    to the Gemini API.{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ait-font-medium ait-text-primary hover:ait-text-primary-hover"
                    >
                      Get API key →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Context menu items tab */}
          {activeTab === "menu" && (
            <div className="ait-rounded-lg ait-border ait-border-gray-200 ait-bg-white ait-shadow-sm">
              <div className="ait-p-6">
                <div className="ait-space-y-6">
                  {/* Default context menu items */}
                  <div>
                    <h3 className="ait-mb-2 ait-text-sm ait-font-medium ait-text-gray-700">
                      Default items
                    </h3>
                    <div className="ait-space-y-3">
                      {defaultContextMenuItems.map((item) => (
                        <div
                          key={item.id}
                          className="ait-flex ait-items-start ait-gap-4 ait-rounded-lg ait-border ait-border-gray-100 ait-bg-gray-50 ait-p-4"
                        >
                          <div className="ait-flex-1">
                            <div className="ait-flex ait-items-center ait-gap-2">
                              <LockIcon />
                              <div className="ait-font-medium ait-text-gray-700">{item.title}</div>
                            </div>
                            <div className="ait-mt-1 ait-text-sm ait-text-gray-500">
                              {item.instruction}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom context menu items */}
                  <div>
                    <h3 className="ait-mb-2 ait-text-sm ait-font-medium ait-text-gray-700">
                      Custom items
                    </h3>
                    <div className="ait-space-y-3">
                      {customContextMenuItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="ait-flex ait-items-start ait-gap-4 ait-rounded-lg ait-border ait-border-gray-200 ait-p-4"
                        >
                          {editingContextMenuItem?.id === item.id ? (
                            <div className="ait-flex-1 ait-space-y-3">
                              <div>
                                <label className="ait-mb-1 ait-block ait-text-sm ait-font-medium ait-text-gray-700">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={editingContextMenuItem.title}
                                  onChange={(e) =>
                                    setEditingContextMenuItem({
                                      ...editingContextMenuItem,
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
                                  value={editingContextMenuItem.instruction}
                                  onChange={(e) =>
                                    setEditingContextMenuItem({
                                      ...editingContextMenuItem,
                                      instruction: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="ait-block ait-w-full ait-rounded-md ait-border ait-border-gray-300 ait-px-3 ait-py-2 ait-text-sm ait-placeholder-gray-400 ait-shadow-sm focus:ait-border-primary focus:ait-outline-none focus:ait-ring-2 focus:ait-ring-primary"
                                />
                              </div>
                              <div className="ait-flex ait-justify-end ait-gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => setEditingContextMenuItem(null)}
                                >
                                  Cancel
                                </Button>
                                <Button variant="primary" onClick={saveEditingContextMenuItem}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="ait-flex-1">
                                <div className="ait-font-medium ait-text-gray-700">
                                  {item.title}
                                </div>
                                <div className="ait-mt-1 ait-text-sm ait-text-gray-500">
                                  {item.instruction}
                                </div>
                              </div>
                              <div className="ait-flex ait-gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => startEditingContextMenuItem(item, index)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => removeContextMenuItem(item.id)}
                                >
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
                            value={newContextMenuItem.title}
                            onChange={(e) =>
                              setNewContextMenuItem({
                                ...newContextMenuItem,
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
                            value={newContextMenuItem.instruction}
                            onChange={(e) =>
                              setNewContextMenuItem({
                                ...newContextMenuItem,
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
                            onClick={addContextMenuItem}
                            disabled={!newContextMenuItem.title || !newContextMenuItem.instruction}
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
          )}

          {/* Form footer */}
          <div className="ait-flex ait-items-center ait-justify-between ait-px-2 ait-py-1">
            <div
              className={clsx(
                "ait-text-sm",
                alert?.type === "success" ? "ait-text-green-600" : "ait-text-red-600"
              )}
            >
              {alert?.message}
            </div>
            <Button
              variant="primary"
              disabled={isLoading !== null}
              loading={isLoading === "save-settings"}
              type="submit"
            >
              Save
            </Button>
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
