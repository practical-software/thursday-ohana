import { useState, useEffect } from "react";
import {
  Container,
  Title,
  SegmentedControl,
  Button,
  Group,
  Card,
  Text,
  Table,
  ActionIcon,
  Autocomplete,
  Divider,
  Stack,
  Tabs,
  ScrollArea,
  Modal,
} from "@mantine/core";
import { IconTrash, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type {
  BowlerType,
  SidePotKey,
  MoneyTransferType,
  DoublesEntry,
  AppState,
} from "./types";
import { PRICING, NAME_LIST } from "./types";

const STORAGE_KEY = "bowling-calculator-state";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Sort names alphabetically by first name
const getSortedNames = () => {
  return [...NAME_LIST].sort((a, b) => {
    const firstNameA = a.split(" ")[0].toLowerCase();
    const firstNameB = b.split(" ")[0].toLowerCase();
    return firstNameA.localeCompare(firstNameB);
  });
};

const getDefaultState = (): AppState => ({
  bowlerType: "regular",
  sidePots: {
    scratch: false,
    handicap: false,
    optionalSideHandicap: false,
  },
  doublesEntries: [],
  favorites: [],
  activeTab: "calculator",
});

function App() {
  const [state, setState] = useState<AppState>(getDefaultState);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);
  const [isAlertModal, setIsAlertModal] = useState(false);

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState && savedState.trim() !== "") {
      try {
        const parsedState = JSON.parse(savedState);

        // Validate that it's actually an object with the expected structure
        if (typeof parsedState === "object" && parsedState !== null) {
          // Ensure favorites array exists and is valid
          if (!Array.isArray(parsedState.favorites)) {
            parsedState.favorites = [];
          }
          // Ensure doublesEntries array exists and is valid
          if (!Array.isArray(parsedState.doublesEntries)) {
            parsedState.doublesEntries = [];
          }

          // Automatically add favorites to doubles entries on load
          const favoritesToAdd = parsedState.favorites.filter(
            (favorite: string) => {
              // Only add favorites that aren't already in doubles entries
              return !parsedState.doublesEntries.some(
                (entry: DoublesEntry) =>
                  entry.partnerName.toLowerCase() === favorite.toLowerCase()
              );
            }
          );

          if (favoritesToAdd.length > 0) {
            const newDoublesEntries: DoublesEntry[] = [
              ...parsedState.doublesEntries,
              ...favoritesToAdd.map((favorite: string) => ({
                id: uuidv4(),
                partnerName: favorite,
                moneyTransfer: "noMoneyYet" as const,
              })),
            ];
            parsedState.doublesEntries = newDoublesEntries;
            console.log("Auto-added favorites to doubles:", favoritesToAdd);
          }

          setState(parsedState);
          console.log(
            "Loaded favorites from localStorage:",
            parsedState.favorites
          );
        } else {
          console.warn(
            "Invalid state structure in localStorage, using default state"
          );
          setState(getDefaultState());
        }
      } catch (error) {
        console.error("Failed to parse saved state:", error);
        // If parsing fails, use default state
        setState(getDefaultState());
      }
    } else {
      console.log("No saved state found in localStorage, using default state");
      setState(getDefaultState());
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever state changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return; // Don't save until we've loaded from localStorage

    try {
      const stateToSave = {
        ...state,
        favorites: Array.isArray(state.favorites) ? state.favorites : [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log("Saved favorites to localStorage:", stateToSave.favorites);
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }, [state, isInitialized]);

  const updateBowlerType = (bowlerType: BowlerType) => {
    setState((prev) => ({ ...prev, bowlerType }));
  };

  const updateSidePot = (pot: SidePotKey, value: boolean) => {
    setState((prev) => ({
      ...prev,
      sidePots: { ...prev.sidePots, [pot]: value },
    }));
  };

  // Get available partner names (excluding already selected ones)
  const getAvailablePartnerNames = () => {
    const selectedNames = new Set(
      state.doublesEntries.map((entry) => entry.partnerName.toLowerCase())
    );
    return getSortedNames().filter(
      (name) => !selectedNames.has(name.toLowerCase())
    );
  };

  const addDoublesEntry = () => {
    if (!newPartnerName.trim()) return;

    const trimmedName = newPartnerName.trim();

    // Check if partner is already added (case-insensitive)
    const isAlreadyAdded = state.doublesEntries.some(
      (entry) => entry.partnerName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isAlreadyAdded) {
      showAlert(
        "Duplicate Partner",
        `${trimmedName} is already added as a partner.`
      );
      return;
    }

    const newEntry: DoublesEntry = {
      id: uuidv4(),
      partnerName: trimmedName,
      moneyTransfer: "noMoneyYet",
    };

    setState((prev) => ({
      ...prev,
      doublesEntries: [...prev.doublesEntries, newEntry],
    }));
    setNewPartnerName("");
  };

  const updateDoublesEntry = (id: string, updates: Partial<DoublesEntry>) => {
    setState((prev) => ({
      ...prev,
      doublesEntries: prev.doublesEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));
  };

  const removeDoublesEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      doublesEntries: prev.doublesEntries.filter((entry) => entry.id !== id),
    }));
  };

  const toggleFavorite = (name: string) => {
    setState((prev) => {
      const isFavorite = prev.favorites.includes(name);
      if (isFavorite) {
        // Remove from favorites and remove as teammate
        return {
          ...prev,
          favorites: prev.favorites.filter((fav) => fav !== name),
          doublesEntries: prev.doublesEntries.filter(
            (entry) => entry.partnerName !== name
          ),
        };
      } else {
        // Add to favorites and automatically add as teammate
        const newFavorites = [...prev.favorites, name];

        // Check if partner is already added (case-insensitive)
        const isAlreadyAdded = prev.doublesEntries.some(
          (entry) => entry.partnerName.toLowerCase() === name.toLowerCase()
        );

        if (isAlreadyAdded) {
          return {
            ...prev,
            favorites: newFavorites,
          };
        } else {
          const newEntry: DoublesEntry = {
            id: uuidv4(),
            partnerName: name,
            moneyTransfer: "noMoneyYet",
          };
          return {
            ...prev,
            favorites: newFavorites,
            doublesEntries: [...prev.doublesEntries, newEntry],
          };
        }
      }
    });
  };

  const setActiveTab = (tab: string | null) => {
    if (tab === null) return;
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  const clearAllFavorites = () => {
    setState((prev) => ({
      ...prev,
      favorites: [],
      doublesEntries: prev.doublesEntries.filter(
        (entry) => !prev.favorites.includes(entry.partnerName)
      ),
    }));
  };

  const resetApp = () => {
    try {
      const currentFavorites = Array.isArray(state.favorites)
        ? state.favorites
        : [];
      const currentDoublesEntries = Array.isArray(state.doublesEntries)
        ? state.doublesEntries
        : [];

      const resetState = getDefaultState();

      // Preserve favorites
      resetState.favorites = currentFavorites;

      // Preserve doubles entries but reset their money transfer state
      resetState.doublesEntries = currentDoublesEntries.map((entry) => ({
        ...entry,
        moneyTransfer: "noMoneyYet" as const,
      }));

      setState(resetState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
      console.log("Reset app, preserved favorites:", currentFavorites);
      console.log(
        "Reset money transfers for",
        currentDoublesEntries.length,
        "teammates"
      );
    } catch (error) {
      console.error("Failed to reset app:", error);
      // Fallback: just use default state
      setState(getDefaultState());
    }
  };

  // Modal helper functions
  const showAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(null);
    setIsAlertModal(true);
    setModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (modalAction) {
      modalAction();
    }
    setModalOpen(false);
    setModalAction(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalAction(null);
  };

  // Calculations
  const lineageTotal = PRICING[state.bowlerType];
  const sidepotTotal =
    (state.sidePots.scratch ? PRICING.scratch : 0) +
    (state.sidePots.handicap ? PRICING.handicap : 0) +
    (state.sidePots.optionalSideHandicap ? PRICING.optionalSideHandicap : 0);

  // Count teams where they gave me $3 (I need to pay the team cost to captain)
  const doublesTheyGaveMeCount = state.doublesEntries.filter(
    (entry) => entry.moneyTransfer === "theyGaveMe"
  ).length;
  const doublesToCaptain = doublesTheyGaveMeCount * PRICING.doublesTeamCost;

  // Count teams where I gave $3 to partner (for my share of their team cost)
  const doublesIGaveCount = state.doublesEntries.filter(
    (entry) => entry.moneyTransfer === "iGave"
  ).length;
  const moneyGivenToPartners =
    doublesIGaveCount * PRICING.doublesPartnerPayment;

  const moneyGivenToMe =
    state.doublesEntries.filter((entry) => entry.moneyTransfer === "theyGaveMe")
      .length * PRICING.doublesPartnerPayment;

  const totalToTeamCaptain = lineageTotal + sidepotTotal + doublesToCaptain;
  const totalPaidOverall =
    totalToTeamCaptain + moneyGivenToPartners - moneyGivenToMe;

  return (
    <Container size="lg" px={{ base: 0, sm: "md" }} py={{ base: 0, sm: "md" }}>
      <Stack gap="md">
        <Group justify="center" align="center">
          <Title order={1}>Thursday Night Ohana Money Calculator</Title>
        </Group>

        <Tabs
          value={state.activeTab}
          onChange={setActiveTab}
          keepMounted={false}
        >
          <Tabs.List style={{ width: "100%", justifyContent: "space-between" }}>
            <Tabs.Tab
              value="calculator"
              style={{
                flex: 1,
                maxWidth: "50%",
                fontSize: "1.2rem",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Calculator
            </Tabs.Tab>
            <Tabs.Tab
              value="favorites"
              style={{
                flex: 1,
                maxWidth: "50%",
                fontSize: "1.2rem",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Favorites
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="calculator" pt="md">
            <Stack gap="lg">
              {/* Clear Calculator Button */}
              <Group justify="flex-end">
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to clear the calculator? This will reset all your calculations and money transfers."
                      )
                    ) {
                      resetApp();
                    }
                  }}
                  style={{
                    width: "auto",
                    minWidth: "fit-content",
                  }}
                >
                  Clear Calculator
                </Button>
              </Group>

              {/* Section 1: Lineage */}
              <Card withBorder>
                <Title order={3} mb="sm">
                  Lineage
                </Title>
                <Group
                  align="center"
                  wrap="wrap"
                  gap="xs"
                  className="lineage-container"
                >
                  <SegmentedControl
                    data={[
                      {
                        label: `Regular (${formatCurrency(PRICING.regular)})`,
                        value: "regular",
                      },
                      {
                        label: `Sub (${formatCurrency(PRICING.sub)})`,
                        value: "sub",
                      },
                    ]}
                    value={state.bowlerType}
                    onChange={(value) => updateBowlerType(value as BowlerType)}
                    size="md"
                    className="lineage-control"
                    fullWidth
                  />
                </Group>
              </Card>

              {/* Section 2: Side Pots */}
              <Card withBorder>
                <Title order={3} mb="sm">
                  Side Pots
                </Title>
                <Group
                  gap="xs"
                  mb="md"
                  wrap="wrap"
                  className="side-pots-container"
                >
                  <Button
                    variant={state.sidePots.scratch ? "filled" : "outline"}
                    onClick={() =>
                      updateSidePot("scratch", !state.sidePots.scratch)
                    }
                    size="md"
                    className="side-pot-button"
                  >
                    Scratch {formatCurrency(PRICING.scratch)}
                  </Button>
                  <Button
                    variant={state.sidePots.handicap ? "filled" : "outline"}
                    onClick={() =>
                      updateSidePot("handicap", !state.sidePots.handicap)
                    }
                    size="md"
                    className="side-pot-button"
                  >
                    Handicap {formatCurrency(PRICING.handicap)}
                  </Button>
                  <Button
                    variant={
                      state.sidePots.optionalSideHandicap ? "filled" : "outline"
                    }
                    onClick={() =>
                      updateSidePot(
                        "optionalSideHandicap",
                        !state.sidePots.optionalSideHandicap
                      )
                    }
                    size="md"
                    className="side-pot-button"
                  >
                    Optional Side Handicap{" "}
                    {formatCurrency(PRICING.optionalSideHandicap)}
                  </Button>
                </Group>
              </Card>

              {/* Section 3: Handicap Doubles */}
              <Card withBorder>
                <Title order={3} mb="sm">
                  Handicap Doubles
                </Title>

                {/* Add new entry form */}
                <Group gap="xs" mb="lg" align="flex-start">
                  <Autocomplete
                    placeholder="Enter partner name"
                    data={getAvailablePartnerNames()}
                    value={newPartnerName}
                    onChange={setNewPartnerName}
                    size="md"
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={addDoublesEntry}
                    disabled={!newPartnerName.trim()}
                    size="md"
                    className="add-team-button"
                  >
                    Add Partner
                  </Button>
                </Group>

                {/* Doubles entries - responsive table and mobile cards */}
                {state.doublesEntries.length > 0 && (
                  <>
                    {/* Desktop Table */}
                    <div className="responsive-table-container">
                      <Table
                        striped
                        highlightOnHover
                        className="responsive-table"
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th
                              style={{
                                whiteSpace: "nowrap",
                                textAlign: "left",
                              }}
                            >
                              Partner
                            </Table.Th>
                            <Table.Th style={{ textAlign: "left" }}>
                              Money Exchanged
                            </Table.Th>
                            <Table.Th
                              style={{
                                whiteSpace: "nowrap",
                                textAlign: "center",
                              }}
                            >
                              Delete
                            </Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {state.doublesEntries.map((entry) => (
                            <Table.Tr key={entry.id}>
                              <Table.Td
                                style={{
                                  padding: "8px 4px 8px 12px",
                                  textAlign: "left",
                                }}
                              >
                                <Text size="sm">{entry.partnerName}</Text>
                              </Table.Td>
                              <Table.Td style={{ padding: "8px 4px" }}>
                                <SegmentedControl
                                  data={[
                                    {
                                      label: "None",
                                      value: "noMoneyYet",
                                    },
                                    { label: "Gave $3", value: "iGave" },
                                    {
                                      label: "Given $3",
                                      value: "theyGaveMe",
                                    },
                                  ]}
                                  value={entry.moneyTransfer}
                                  onChange={(value) =>
                                    updateDoublesEntry(entry.id, {
                                      moneyTransfer: value as MoneyTransferType,
                                    })
                                  }
                                  size="xs"
                                  fullWidth
                                  className="money-transfer-control"
                                />
                              </Table.Td>
                              <Table.Td
                                style={{
                                  padding: "8px 8px",
                                  textAlign: "center",
                                }}
                              >
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() => removeDoublesEntry(entry.id)}
                                  size="md"
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="table-mobile-cards">
                      {state.doublesEntries.map((entry) => (
                        <div key={entry.id} className="mobile-card">
                          <div className="mobile-card-header">
                            <div className="mobile-card-partner">
                              {entry.partnerName}
                            </div>
                            <div className="mobile-card-delete">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => removeDoublesEntry(entry.id)}
                                size="md"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </div>
                          </div>

                          <div className="mobile-card-money">
                            <span className="mobile-card-label">
                              Money Exchanged
                            </span>
                            <SegmentedControl
                              data={[
                                {
                                  label: "None",
                                  value: "noMoneyYet",
                                },
                                { label: "Gave $3", value: "iGave" },
                                {
                                  label: "Given $3",
                                  value: "theyGaveMe",
                                },
                              ]}
                              value={entry.moneyTransfer}
                              onChange={(value) =>
                                updateDoublesEntry(entry.id, {
                                  moneyTransfer: value as MoneyTransferType,
                                })
                              }
                              size="sm"
                              fullWidth
                              className="money-transfer-control"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              {/* Section 4: Totals */}
              <Card withBorder>
                <Title order={3} mb="sm">
                  Totals
                </Title>
                <Stack gap="sm">
                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text size="md">Lineage:</Text>
                    <Text size="md">{formatCurrency(lineageTotal)}</Text>
                  </Group>
                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text size="md">Side pots:</Text>
                    <Text size="md">{formatCurrency(sidepotTotal)}</Text>
                  </Group>
                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text size="sm">
                      Doubles you pay ({doublesTheyGaveMeCount} ×{" "}
                      {formatCurrency(PRICING.doublesTeamCost)}):
                    </Text>
                    <Text size="md">{formatCurrency(doublesToCaptain)}</Text>
                  </Group>

                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text fw={600} size="lg">
                      Total to team captain:
                    </Text>
                    <Text fw={600} size="lg">
                      {formatCurrency(totalToTeamCaptain)}
                    </Text>
                  </Group>

                  <Divider />
                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text size="sm">
                      Money given to partners ({doublesIGaveCount} ×{" "}
                      {formatCurrency(PRICING.doublesPartnerPayment)}):
                    </Text>
                    <Text size="md">
                      {formatCurrency(moneyGivenToPartners)}
                    </Text>
                  </Group>

                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text size="sm">
                      Money given to me ({doublesTheyGaveMeCount} ×{" "}
                      {formatCurrency(PRICING.doublesPartnerPayment)}):
                    </Text>
                    <Text size="md">-{formatCurrency(moneyGivenToMe)}</Text>
                  </Group>

                  <Divider />

                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <Text fw={700} size="xl">
                      Overall Total:
                    </Text>
                    <Text fw={700} size="xl">
                      {formatCurrency(totalPaidOverall)}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="favorites" pt="md">
            <Card withBorder>
              <div
                style={{
                  position: "relative",
                  marginBottom: "var(--mantine-spacing-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Text size="sm" c="dimmed" mb="sm">
                  Click the heart icon to favorite someone. Favorites are
                  automatically added as teammates in your doubles partners.
                </Text>
                {state.favorites.length > 0 && (
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    className="clear-favorites-button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to clear all favorites? This will remove all favorites and their associated doubles entries."
                        )
                      ) {
                        clearAllFavorites();
                      }
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <ScrollArea h="calc(100vh - 300px)">
                <div className="favorites-grid">
                  {getSortedNames().map((name) => {
                    const isFavorite = state.favorites.includes(name);
                    return (
                      <Card
                        key={name}
                        withBorder
                        padding="sm"
                        className="favorites-grid-item"
                      >
                        <Group
                          justify="flex-start"
                          align="center"
                          gap="xs"
                          className="favorites-item-group"
                        >
                          <ActionIcon
                            variant="subtle"
                            color={isFavorite ? "red" : "gray"}
                            onClick={() => toggleFavorite(name)}
                            size="md"
                            className="favorite-heart-button"
                          >
                            {isFavorite ? (
                              <IconHeartFilled size={20} />
                            ) : (
                              <IconHeart size={20} />
                            )}
                          </ActionIcon>
                          <Text size="md">{name}</Text>
                        </Group>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Footer */}
      <Group justify="center" mt="xl" mb="md">
        <Text size="md" c="dimmed">
          written by{" "}
          <Text
            component="a"
            href="https://portfolio.practicalsoftware.com"
            target="_blank"
            rel="noopener noreferrer"
            size="md"
            c="dimmed"
            fw={500}
            style={{ textDecoration: "underline" }}
          >
            Justin Sumiye
          </Text>{" "}
          | Practical Software
        </Text>
      </Group>

      {/* Modal for alerts and confirmations */}
      <Modal
        opened={modalOpen}
        onClose={handleModalClose}
        title={modalTitle}
        centered
        size="md"
      >
        <Text mb="lg">{modalMessage}</Text>
        <Group justify="flex-end">
          {isAlertModal ? (
            <Button onClick={handleModalClose}>OK</Button>
          ) : (
            <>
              <Button variant="light" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button color="red" onClick={handleModalConfirm}>
                Confirm
              </Button>
            </>
          )}
        </Group>
      </Modal>
    </Container>
  );
}

export default App;
