import { useState, useEffect } from "react";
import {
  Container,
  Title,
  SegmentedControl,
  Badge,
  Button,
  Group,
  Card,
  Text,
  Table,
  ActionIcon,
  Autocomplete,
  Divider,
  Stack,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type {
  BowlerType,
  SidePotKey,
  MoneyTransferType,
  DoublesEntry,
  AppState,
} from "./types";
import { PRICING, FAKE_PARTNER_NAMES } from "./types";

const STORAGE_KEY = "bowling-calculator-state";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const getDefaultState = (): AppState => ({
  bowlerType: "regular",
  sidePots: {
    scratch: false,
    handicap: false,
    optionalSideHandicap: false,
  },
  doublesEntries: [],
});

function App() {
  const [state, setState] = useState<AppState>(getDefaultState);
  const [newPartnerName, setNewPartnerName] = useState("");

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      } catch (error) {
        console.error("Failed to parse saved state:", error);
      }
    }
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateBowlerType = (bowlerType: BowlerType) => {
    setState((prev) => ({ ...prev, bowlerType }));
  };

  const updateSidePot = (pot: SidePotKey, value: boolean) => {
    setState((prev) => ({
      ...prev,
      sidePots: { ...prev.sidePots, [pot]: value },
    }));
  };

  const addDoublesEntry = () => {
    if (!newPartnerName.trim()) return;

    const newEntry: DoublesEntry = {
      id: uuidv4(),
      partnerName: newPartnerName.trim(),
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

  const resetApp = () => {
    setState(getDefaultState());
    localStorage.removeItem(STORAGE_KEY);
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

  const cashCollectedFromPartners =
    state.doublesEntries.filter((entry) => entry.moneyTransfer === "theyGaveMe")
      .length * PRICING.doublesPartnerPayment;

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Title order={1}>Bowling League Money Calculator</Title>
          <Button variant="light" color="red" onClick={resetApp}>
            Reset
          </Button>
        </Group>

        {/* Section 1: Lineage */}
        <Card withBorder>
          <Title order={3} mb="md">
            Lineage
          </Title>
          <Group align="center">
            <SegmentedControl
              data={[
                { label: "Regular", value: "regular" },
                { label: "Sub", value: "sub" },
              ]}
              value={state.bowlerType}
              onChange={(value) => updateBowlerType(value as BowlerType)}
            />
            <Badge variant="filled" color="blue" size="lg">
              {formatCurrency(lineageTotal)}
            </Badge>
          </Group>
        </Card>

        {/* Section 2: Side Pots */}
        <Card withBorder>
          <Title order={3} mb="md">
            Side Pots
          </Title>
          <Group mb="md">
            <Button
              variant={state.sidePots.scratch ? "filled" : "outline"}
              onClick={() => updateSidePot("scratch", !state.sidePots.scratch)}
              size="md"
            >
              Scratch {formatCurrency(PRICING.scratch)}
            </Button>
            <Button
              variant={state.sidePots.handicap ? "filled" : "outline"}
              onClick={() =>
                updateSidePot("handicap", !state.sidePots.handicap)
              }
              size="md"
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
            >
              Optional Side Handicap{" "}
              {formatCurrency(PRICING.optionalSideHandicap)}
            </Button>
          </Group>
          <Badge variant="filled" color="green" size="lg">
            Subtotal: {formatCurrency(sidepotTotal)}
          </Badge>
        </Card>

        {/* Section 3: Handicap Doubles */}
        <Card withBorder>
          <Title order={3} mb="md">
            Handicap Doubles
          </Title>

          {/* Add new entry form */}
          <Group mb="lg" align="end">
            <Autocomplete
              label="Partner Name"
              placeholder="Enter partner name"
              data={FAKE_PARTNER_NAMES}
              value={newPartnerName}
              onChange={setNewPartnerName}
              style={{ flex: 1 }}
            />
            <Button onClick={addDoublesEntry} disabled={!newPartnerName.trim()}>
              Add Team
            </Button>
          </Group>

          {/* Doubles entries table */}
          {state.doublesEntries.length > 0 && (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Partner</Table.Th>
                  <Table.Th>Money Exchanged</Table.Th>
                  <Table.Th>Team Cost</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {state.doublesEntries.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{entry.partnerName}</Table.Td>
                    <Table.Td>
                      <SegmentedControl
                        data={[
                          { label: "No money yet", value: "noMoneyYet" },
                          { label: "I gave $3", value: "iGave" },
                          { label: "They gave me $3", value: "theyGaveMe" },
                        ]}
                        value={entry.moneyTransfer}
                        onChange={(value) =>
                          updateDoublesEntry(entry.id, {
                            moneyTransfer: value as MoneyTransferType,
                          })
                        }
                        size="xs"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>
                        {entry.moneyTransfer === "theyGaveMe"
                          ? formatCurrency(PRICING.doublesTeamCost)
                          : formatCurrency(0)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => removeDoublesEntry(entry.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        {/* Section 4: Totals */}
        <Card withBorder>
          <Title order={3} mb="md">
            Totals
          </Title>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text>Lineage:</Text>
              <Text>{formatCurrency(lineageTotal)}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Side pots:</Text>
              <Text>{formatCurrency(sidepotTotal)}</Text>
            </Group>
            <Group justify="space-between">
              <Text>
                Doubles you pay ({doublesTheyGaveMeCount} ×{" "}
                {formatCurrency(PRICING.doublesTeamCost)}):
              </Text>
              <Text>{formatCurrency(doublesToCaptain)}</Text>
            </Group>

            <Divider />
            <Group justify="space-between">
              <Text>
                Money given to partners ({doublesIGaveCount} ×{" "}
                {formatCurrency(PRICING.doublesPartnerPayment)}):
              </Text>
              <Text>{formatCurrency(moneyGivenToPartners)}</Text>
            </Group>

            <Group justify="space-between">
              <Text>
                Money given to me ({doublesTheyGaveMeCount} ×{" "}
                {formatCurrency(PRICING.doublesPartnerPayment)}):
              </Text>
              <Text>+{formatCurrency(moneyGivenToMe)}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600} size="lg">
                Total to team captain:
              </Text>
              <Text fw={600} size="lg">
                {formatCurrency(totalToTeamCaptain)}
              </Text>
            </Group>

            <Divider />

            <Group justify="space-between">
              <Text fw={700} size="xl">
                Total I spent overall:
              </Text>
              <Text fw={700} size="xl">
                {formatCurrency(totalPaidOverall)}
              </Text>
            </Group>

            <Text c="dimmed" size="sm" ta="center">
              Cash collected from partners:{" "}
              {formatCurrency(cashCollectedFromPartners)} (for reference only)
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default App;
