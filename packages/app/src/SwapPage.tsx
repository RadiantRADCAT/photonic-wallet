import { Select } from "@chakra-ui/react";
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  Text,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { TokenContent } from "./TokenContent";
import rxdIcon from "../assets/rxd.png";
import { useState } from "react";
import { SmartTokenType } from "./types";


const FEE_AMOUNT = 200;
const FEE_RECIPIENT_ADDRESS = "1LqoPnuUm3kdKvPJrELoe6JY3mJc9C7d1e";

function Row({ name, ticker, icon, onChangeValue, onDelete, onSelectToken }) {
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
            {/* Add the remaining 51 tokens here */}
            <option value="LTC">LTC</option>
            <option value="XRP">XRP</option>
            <option value="ADA">ADA</option>
            <option value="DOT">DOT</option>
            <option value="DOGE">DOGE</option>
            <option value="UNI">UNI</option>
            <option value="LINK">LINK</option>
            <option value="SOL">SOL</option>
            <option value="XLM">XLM</option>
            <option value="MATIC">MATIC</option>
            <option value="VET">VET</option>
            <option value="EOS">EOS</option>
            <option value="TRX">TRX</option>
            <option value="FIL">FIL</option>
            <option value="XTZ">XTZ</option>
            <option value="ALGO">ALGO</option>
            <option value="ATOM">ATOM</option>
            <option value="XMR">XMR</option>
            <option value="AAVE">AAVE</option>
            <option value="NEO">NEO</option>
            <option value="MKR">MKR</option>
            <option value="COMP">COMP</option>
            <option value="SNX">SNX</option>
            <option value="YFI">YFI</option>
            <option value="DASH">DASH</option>
            <option value="ZEC">ZEC</option>
            <option value="BAT">BAT</option>
            <option value="SUSHI">SUSHI</option>
            <option value="THETA">THETA</option>
            <option value="1INCH">1INCH</option>
            <option value="GRT">GRT</option>
            <option value="ENJ">ENJ</option>
            <option value="WAVES">WAVES</option>
            <option value="KSM">KSM</option>
            <option value="CAKE">CAKE</option>
            <option value="NEAR">NEAR</option>
            <option value="ZIL">ZIL</option>
            <option value="ONT">ONT</option>
            <option value="CRV">CRV</option>
            <option value="QTUM">QTUM</option>
            <option value="ZRX">ZRX</option>
            <option value="NANO">NANO</option>
            <option value="ICX">ICX</option>
            <option value="OMG">OMG</option>
            <option value="ANKR">ANKR</option>
            <option value="REN">REN</option>
            <option value="FTM">FTM</option>
            <option value="MANA">MANA</option>
            <option value="SAND">SAND</option>
          </Select>
        </InputRightAddon>
      </InputGroup>
      <IconButton
        icon={<DeleteIcon />}
        onClick={onDelete}
        aria-label="Remove"
      />
    </Grid>
  );
}

function OutputSelection({ heading, asset, setAsset, setRxd }) {
  const onChangeValue = (value) => {
    if (asset) {
      setAsset({ ...asset, value: parseInt(value, 10) });
    }
  };

  const onSelectToken = (e) => {
    const selectedToken = e.target.value;
    if (selectedToken === "RXD") {
      setAsset(null);
      setRxd(0);
    } else {
      // Here you would typically fetch the glyph data for the selected token
      // For now, we'll just use a placeholder
      setAsset({
        glyph: { id: selectedToken, name: selectedToken, ticker: selectedToken },
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
          onChangeValue={(e) => asset ? onChangeValue(e.target.value) : setRxd(Number(e.target.value))}
          onDelete={remove}
          onSelectToken={onSelectToken}
        />
        <Text fontSize="sm" color="gray.500">
          Fee: {FEE_AMOUNT} RXD
        </Text>
      </Flex>
    </Card>
  );
}

function SwapPage() {
  const [send, setSend] = useState<Asset | null>(null);
  const [sendRxd, setSendRxd] = useState(0);
  const [receive, setReceive] = useState<Asset | null>(null);
  const [receiveRxd, setReceiveRxd] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateTotalWithFee = (amount: number) => amount + FEE_AMOUNT;

  const prepareTransaction = async () => {
    try {
      setIsProcessing(true);

      // Validate inputs
      if (!send && sendRxd === 0) {
        throw new Error("Please select or enter an amount to send.");
      }

      if (!receive && receiveRxd === 0) {
        throw new Error("Please select or enter an amount to receive.");
      }

      const coins = await db.txo.where({ spent: 0 }).toArray();
      const txs = [];

      // Add fee to sendRxd
      const totalSendRxd = calculateTotalWithFee(sendRxd);

      if (totalSendRxd > 0) {
        txs.push(await prepareRadiant(coins, totalSendRxd));
      }

      if (send?.glyph.tokenType === SmartTokenType.FT) {
        txs.push(await prepareFungible(coins, send.glyph.id, send));
      } else if (send?.glyph.tokenType === SmartTokenType.NFT) {
        txs.push(await prepareNonFungible(coins, send.glyph.id, send));
      }

      // Prepare transaction for fee
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

  return (
    <Flex flexDir="column" gap={8} p={8}>
      <OutputSelection heading="You send" asset={send} setAsset={setSend} setRxd={setSendRxd} />
      <OutputSelection heading="You receive" asset={receive} setAsset={setReceive} setRxd={setReceiveRxd} />
      <Button onClick={prepareTransaction} isLoading={isProcessing}>Swap</Button>
    </Flex>
  );
}

const prepareRadiant = async (coins, value, recipientAddress = wallet.value.swapAddress) => {
  const { tx, selected } = transferRadiant(
    coins,
    wallet.value.address,
    p2pkhScript(recipientAddress),
    value,
    feeRate.value,
    wallet.value.wif as string
  );

  const rawTx = tx.toString();
  const txid = await electrumWorker.value.broadcast(rawTx);
  await updateWalletUtxos(
    ContractType.RXD,
    p2pkhScript(wallet.value.address),
    p2pkhScript(wallet.value.address),
    txid,
    selected.inputs,
    selected.outputs
  );
  return tx;
};

export default SwapPage;

