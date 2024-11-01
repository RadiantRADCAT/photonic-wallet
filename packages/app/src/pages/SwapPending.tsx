import db from "@app/db";
import {
  ContractType,
  SmartToken,
  SwapError,
  SwapStatus,
  TokenSwap,
} from "@app/types";
import {
  Button,
  Container,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useClipboard,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useLiveQuery } from "dexie-react-hooks";
import { openModal, wallet } from "@app/signals";
import SwapTable from "@app/components/SwapTable";
import Card from "@app/components/Card";
import { cancelSwap } from "@app/swap";
import { TbZoom } from "react-icons/tb";
import { t } from "@lingui/macro";
import { createContext, PropsWithChildren, useContext, useState } from "react";
import ViewSwap from "@app/components/ViewSwap";

const ModalContext = createContext<((swap: TokenSwap) => void) | null>(null);

const Actions = ({ swap }: { swap: TokenSwap }) => {
  const openSwap = useContext(ModalContext);

  const toast = useToast();
  const cancel = async (swap: TokenSwap) => {
    if (wallet.value.locked) {
      openModal.value = {
        modal: "unlock",
      };
      return;
    }

    try {
      await cancelSwap(
        swap.from,
        swap.txid,
        swap.fromValue,
        swap.fromGlyph || undefined
      );
    } catch (error) {
      console.debug(error);
      if (error instanceof SwapError) {
        toast({ status: "error", title: error.message });
      } else {
        toast({ status: "error", title: "Failed to cancel" });
      }
      return;
    }
    toast({ status: "success", title: "Swap cancelled" });
    db.swap.update(swap.id as number, { status: SwapStatus.CANCEL });
  };

  return (
    <>
      <Button
        size="sm"
        leftIcon={<TbZoom />}
        mr={2}
        onClick={() => openSwap?.(swap)}
      >
        View
      </Button>
      <Button size="sm" onClick={() => cancel(swap)}>
        Cancel
      </Button>
    </>
  );
};

const ViewFooter = ({ children }: PropsWithChildren) => {
  return <ModalFooter gap={4}>{children}</ModalFooter>;
};

export default function SwapPending() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [openSwap, setOpenSwap] = useState<{
    from: { glyph: SmartToken; value: number } | number;
    to: { glyph: SmartToken; value: number } | number;
    hex: string;
  } | null>(null);
  const pending = useLiveQuery(() =>
    db.swap.where({ status: SwapStatus.PENDING }).toArray()
  );

  const openModal = async (swap: TokenSwap) => {
    // TODO this is a bit messy
    const from =
      swap.from === ContractType.RXD
        ? swap.fromValue
        : {
            glyph: (await db.glyph
              .where({ ref: swap.fromGlyph })
              .first()) as SmartToken,
            value: swap.fromValue,
          };
    const to =
      swap.from === ContractType.RXD
        ? swap.fromValue
        : {
            glyph: (await db.glyph
              .where({ ref: swap.fromGlyph })
              .first()) as SmartToken,
            value: swap.fromValue,
          };
    if (
      (typeof from === "object" && !from.glyph) ||
      (typeof to === "object" && !to.glyph)
    ) {
      return;
    }

    if (from && to) {
      setOpenSwap({ from, to, hex: swap.tx });
      onOpen();
    }
  };

  if (!pending) return null;

  return (
    <ModalContext.Provider value={openModal}>
      <Container maxW="container.xl" px={4} gap={8}>
        {pending?.length ? (
          <SwapTable swaps={pending} actions={Actions} />
        ) : (
          <Card>There are no pending swaps</Card>
        )}
      </Container>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t`Swap`}</ModalHeader>
          <ModalCloseButton />
          {openSwap && (
            <ViewSwap
              from={openSwap.from}
              to={openSwap.to}
              hex={openSwap.hex}
              BodyComponent={ModalBody}
              FooterComponent={ViewFooter}
            />
          )}
        </ModalContent>
      </Modal>
    </ModalContext.Provider>
  );
}
