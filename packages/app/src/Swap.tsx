import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  Select,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { MdOutlineSwapVert } from "react-icons/md";
import { TokenContent } from "@/components/TokenContent";
import {
  Asset,
  ContractType,
  SmartToken,
  SmartTokenType,
  Wallet,
  FeeRate,
} from "@/types";
import {
  transferFungible,
  transferNonFungible,
  transferRadiant,
} from "@/lib/transfer";
import { p2pkhScript, ftScript, nftScript } from "@/lib/script";
import { updateFtBalances, updateRxdBalances, updateWalletUtxos } from "@/lib/utxos";
import db from "@/lib/db";
import { electrumWorker } from "@/lib/electrum";
import rxdIcon from "@/assets/rxd.png";

const FEE_AMOUNT = 200;
const FEE_RECIPIENT_ADDRESS = "1LqoPnuUm3kdKvPJrELoe6JY3mJc9C7d1e";

interface RowProps {
  name: string;
  ticker: string;
  icon: React.ReactNode;
  onChangeValue: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete?: () => void;
  onSelectToken: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function Row({ name, ticker, icon, onChangeValue, onDelete, onSelectToken }: RowProps) {
  return (
    <Grid templateColumns="40px 1fr auto auto" gap={4} alignItems="center">
      <Box>{icon}</Box>
      <InputGroup>
        <Input
          placeholder="0"
          type="number"
          onChange={onChangeValue}
          minW={16}
        />
        <InputRightAddon>
          <Select onChange={onSelectToken} value={ticker}>
            <option value="RXD">RXD</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            {/* Add more token options here */}
          </Select>
        </InputRightAddon>
      </InputGroup>
      {onDelete && (
        <IconButton
          icon={<DeleteIcon />}
          onClick={onDelete}
          aria-label="Remove"
        />
      )}
    </Grid>
  );
}

interface OutputSelectionProps {
  heading: string;
  asset: Asset | null;
  setAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  setRxd: React.Dispatch<React.SetStateAction<number>>;
}

function OutputSelection({ heading, asset, setAsset, setRxd }: OutputSelectionProps) {
  const onChangeValue = (value: string) => {
    if (asset) {
      setAsset({ ...asset, value: parseInt(value, 10) });
    } else {
      setRxd(Number(value));
    }
  };

  const onSelectToken = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedToken = e.target.value;
    if (selectedToken === "RXD") {
      setAsset(null);
      setRxd(0);
    } else {
      setAsset({
        glyph: { id: selectedToken, name: selectedToken, ticker: selectedToken, tokenType: SmartTokenType.FT },
        value: 0
      });
    }
  };

  const remove = () => {
    setAsset(null);
  };

  return (
    <Card>
      <Heading size="md" pb={4}>
        {heading}
      </Heading>
      <Flex flexDir="column" gap={4}>
        <Row
          key={asset ? asset.glyph.id : "rxd"}
          name={asset ? asset.glyph.name : "Radiant"}
          ticker={asset ? asset.glyph.ticker : "RXD"}
          icon={asset ? <TokenContent glyph={asset.glyph} /> : <Image src={rxdIcon} boxSize={8} />}
          onChangeValue={(e) => onChangeValue(e.target.value)}
          onDelete={asset ? remove : undefined}
          onSelectToken={onSelectToken}
        />
        <Text fontSize="sm" color="gray.500">
          Fee: {FEE_AMOUNT} RXD
        </Text>
      </Flex>
    </Card>
  );
}

interface SwapPageProps {
  wallet: Wallet;
  feeRate: FeeRate;
}

function SwapPage({ wallet, feeRate }: SwapPageProps) {
  const toast = useToast();
  const [send, setSend] = useState<Asset | null>(null);
  const [sendRxd, setSendRxd] = useState(0);
  const [receive, setReceive] = useState<Asset | null>(null);
  const [receiveRxd, setReceiveRxd] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateTotalWithFee = (amount: number) => amount + FEE_AMOUNT;

  const prepareTransaction = async () => {
    try {
      setIsProcessing(true);

      if (!send && sendRxd === 0) {
        throw new Error("Please select or enter an amount to send.");
      }

      if (!receive && receiveRxd === 0) {
        throw new Error("Please select or enter an amount to receive.");
      }

      const coins = await db.txo.where({ spent: 0 }).toArray();
      const txs = [];

      const totalSendRxd = calculateTotalWithFee(sendRxd);

      if (totalSendRxd > 0) {
        txs.push(await prepareRadiant(coins, totalSendRxd));
      }

      if (send?.glyph.tokenType === SmartTokenType.FT) {
        txs.push(await prepareFungible(coins, send.glyph.id, send));
      } else if (send?.glyph.tokenType === SmartTokenType.NFT) {
        txs.push(await prepareNonFungible(coins, send.glyph.id, send));
      }

      txs.push(await prepareRadiant(coins, FEE_AMOUNT, FEE_RECIPIENT_ADDRESS));

      toast({
        title: "Transaction prepared.",
        description: "Broadcasting to the network.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred.";
      toast({
        title: "Error preparing transaction.",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const prepareRadiant = async (coins: any[], value: number, recipientAddress = wallet.swapAddress) => {
    const { tx, selected } = transferRadiant(
      coins,
      wallet.address,
      p2pkhScript(recipientAddress),
      value,
      feeRate,
      wallet.wif
    );

    const rawTx = tx.toString();
    const txid = await electrumWorker.broadcast(rawTx);
    await updateWalletUtxos(
      ContractType.RXD,
      p2pkhScript(wallet.address),
      p2pkhScript(wallet.address),
      txid,
      selected.inputs,
      selected.outputs
    );
    return tx;
  };

  const prepareFungible = async (coins: any[], refLE: string, asset: Asset) => {
    const fromScript = ftScript(wallet.address, refLE);
    const tokens = await db.txo.where({ script: fromScript, spent: 0 }).toArray();

    const { tx, selected } = transferFungible(
      coins,
      tokens,
      refLE,
      wallet.address,
      wallet.swapAddress,
      asset.value,
      feeRate,
      wallet.wif
    );

    const rawTx = tx.toString();
    const txid = await electrumWorker.broadcast(rawTx);
    await updateWalletUtxos(
      ContractType.FT,
      fromScript,
      p2pkhScript(wallet.address),
      txid,
      selected.inputs,
      selected.outputs
    );

    updateFtBalances(new Set([fromScript]));
    return tx;
  };

  const prepareNonFungible = async (coins: any[], refLE: string, asset: Asset) => {
    const fromScript = nftScript(wallet.address, refLE);
    const tokens = await db.txo.where({ script: fromScript, spent: 0 }).toArray();

    const { tx, selected } = transferNonFungible(
      coins,
      tokens,
      refLE,
      wallet.address,
      wallet.swapAddress,
      feeRate,
      wallet.wif
    );

    const rawTx = tx.toString();
    const txid = await electrumWorker.broadcast(rawTx);
    await updateWalletUtxos(
      ContractType.NFT,
      fromScript,
      p2pkhScript(wallet.address),
      txid,
      selected.inputs,
      selected.outputs
    );

    return tx;
  };

  return (
    <Container maxW="container.lg" py={6}>
      <Heading size="lg" mb={6}>
        Swap Assets
      </Heading>
      <Grid templateColumns="1fr 1fr" gap={6}>
        <Box>
          <OutputSelection
            heading="Send"
            asset={send}
            setAsset={setSend}
            setRxd={setSendRxd}
          />
        </Box>
        <Box>
          <OutputSelection
            heading="Receive"
            asset={receive}
            setAsset={setReceive}
            setRxd={setReceiveRxd}
          />
        </Box>
      </Grid>
      <Flex justifyContent="center" mt={6}>
        <Button
          onClick={prepareTransaction}
          colorScheme="teal"
          leftIcon={<MdOutlineSwapVert />}
          isDisabled={isProcessing}
        >
          {isProcessing ? <Spinner size="sm" /> : "Swap"}
        </Button>
      </Flex>
    </Container>
  );
}

export default SwapPage;

