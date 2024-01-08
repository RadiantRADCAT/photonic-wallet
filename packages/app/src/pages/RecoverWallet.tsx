import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Textarea,
} from "@chakra-ui/react";
import Wallet from "@app/wallet/wallet";
import Card from "@app/components/Card";
import { NetworkKey } from "../types";
import { wallet } from "@app/signals";
import config from "@app/config.json";

const networkKeys = Object.entries(config.networks)
  .filter(([, v]) => v.enabled)
  .map(([k]) => k);

export default function RecoverWallet() {
  const phrase = useRef<HTMLTextAreaElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const confirm = useRef<HTMLInputElement>(null);
  const network = useRef<HTMLSelectElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const passwordValue = password.current?.value || "";
    const confirmValue = confirm.current?.value || "";
    if (confirmValue !== passwordValue) {
      setError("Passwords do not match");
      return false;
    }

    if (!networkKeys.includes(network.current?.value || "")) {
      setError("Select a valid network");
      return false;
    }

    setLoading(true);

    // setTimeout allows loading spinner to render without a delay
    setTimeout(async () => {
      setError("");
      try {
        const recover = await Wallet.recover(
          network.current?.value as NetworkKey,
          phrase.current?.value || "",
          passwordValue
        );
        if (!recover) {
          return;
        }
        const { address, wif, net } = recover;
        wallet.value = {
          ...wallet.value,
          locked: false,
          exists: true,
          net,
          wif,
          address,
        };

        navigate("/objects");
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          if (error.message === "Invalid mnemonic") {
            setError("Invalid recovery phrase");
          } else {
            setError(error.message);
          }
        } else {
          setError("Unknown error");
        }
      }
      setLoading(false);
    }, 1);
    return false;
  };

  return (
    <Card mb={4} p={4} width="2xl" maxW="100%" mx="auto" mt="120px">
      <Heading size="md" mb={4}>
        Recover your wallet
      </Heading>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={submit}>
        <FormControl mb={4}>
          <FormLabel>Enter your 12 word recovery phrase</FormLabel>
          <Textarea
            ref={phrase}
            placeholder="Recovery phrase"
            size="sm"
            resize="none"
            autoFocus
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>New password</FormLabel>
          <Input ref={password} type="password" placeholder="Password" />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Confirm password</FormLabel>
          <Input ref={confirm} type="password" placeholder="Password" />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Network</FormLabel>
          <Select ref={network}>
            {networkKeys.map((k) => (
              <option value={k}>{k}</option>
            ))}
          </Select>
        </FormControl>
        <Button
          width="full"
          type="submit"
          isLoading={loading}
          loadingText="Recovering"
        >
          Submit
        </Button>
        <Center mt={4}>
          <Button variant="ghost" as={Link} to="/create-wallet">
            Create a new wallet
          </Button>
        </Center>
      </form>
    </Card>
  );
}