import {
  CloseButton,
  Flex,
  Grid,
  GridProps,
  Icon,
  SimpleGrid,
} from "@chakra-ui/react";
import AccountBar from "./AccountBar";
import Logo from "./Logo";
import StatusBar from "./StatusBar";
import { language, openMenu } from "@app/signals";
import { RepeatClockIcon } from "@chakra-ui/icons";
import { t } from "@lingui/macro";
import { HiOutlineAtSymbol } from "react-icons/hi";
import { MdHome } from "react-icons/md";
import { TbTriangleSquareCircle, TbCircles, TbCoins } from "react-icons/tb";
import MenuButton from "./MenuButton";

export default function SideBar({ ...rest }: GridProps) {
  // Trigger rerender when language changes
  language.value;

  return (
    <Grid
      width={{ base: "75%", lg: "232px", "2xl": "284px" }}
      height="100svh"
      bgColor="bg.300"
      gridTemplateRows={{
        base: "72px auto 1fr",
        lg: "auto auto auto 1fr",
      }}
      zIndex={20}
      {...rest}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        px={6}
        display={{ base: "flex", lg: "none" }}
      >
        <CloseButton
          display="none"
          size="lg"
          onClick={() => {
            openMenu.value = false;
          }}
          aria-label="Close menu"
        />
        <Logo
          my={6}
          svgId="m"
          onClick={() => {
            openMenu.value = false;
          }}
        />
      </Flex>
      <Logo my={6} display={{ base: "none", lg: "flex" }} svgId="d" />
      <AccountBar display={{ base: "none", lg: "flex" }} />
      <SimpleGrid
        overflow="auto"
        borderTopWidth={1}
        borderTopColor="whiteAlpha.100"
        mt={{ base: 0, lg: 6 }}
        pt={6}
      >
        <MenuButton
          display={{ base: "inline-flex", lg: "none" }}
          to="/home"
          leftIcon={<Icon as={MdHome} boxSize={4} />}
        >
          {t`Home`}
        </MenuButton>
        <MenuButton
          to="/objects"
          match="/objects"
          leftIcon={<Icon as={TbTriangleSquareCircle} boxSize={4} />}
        >
          {t`Digital Objects`}
        </MenuButton>
        <MenuButton
          to="/fungible"
          match="/fungible"
          leftIcon={<Icon as={TbCircles} boxSize={4} />}
        >
          {t`Fungible Tokens`}
        </MenuButton>
        <MenuButton
          display="none"
          to="/names"
          leftIcon={<Icon as={HiOutlineAtSymbol} boxSize={4} />}
        >
          {t`Universal Names`}
        </MenuButton>
        <MenuButton to="/coins" leftIcon={<Icon as={TbCoins} boxSize={4} />}>
          {t`Coins`}
        </MenuButton>
        <MenuButton to="/history" leftIcon={<RepeatClockIcon boxSize={4} />}>
          {t`History`}
        </MenuButton>
      </SimpleGrid>
      <SimpleGrid
        py={4}
        alignSelf="end"
        borderTopWidth={1}
        borderTopColor="whiteAlpha.100"
      >
        <StatusBar />
      </SimpleGrid>
    </Grid>
  );
}
