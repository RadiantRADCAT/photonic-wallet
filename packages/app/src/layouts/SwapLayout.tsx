import { Button, HStack } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { Link, Outlet, useLocation } from "react-router-dom";
import ContentContainer from "@app/components/ContentContainer";
import PageHeader from "@app/components/PageHeader";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { language } from "@app/signals";
import {
  TbChecks,
  TbClockHour7,
  TbFileUpload,
  TbQuestionMark,
} from "react-icons/tb";
import { LuFilePlus } from "react-icons/lu";
import ActionIcon from "@app/components/ActionIcon";

export default function SwapLayout() {
  // Trigger rerender when language changes
  language.value;

  const { pathname } = useLocation();
  const headings: { [key: string]: string } = {
    "/swap/pending": t`Pending`,
    "/swap/completed": t`Completed`,
    "/swap/missing": t`Missing`,
    "/swap/load": t`Load`,
  };
  const heading = headings[pathname];

  return (
    <ContentContainer>
      <PageHeader>
        {t`Swap`}
        {heading && (
          <>
            <ChevronRightIcon mx={2} /> {heading}
          </>
        )}
      </PageHeader>

      <HStack mb={8} px={4}>
        <Button
          size="sm"
          as={Link}
          to="/swap"
          leftIcon={<ActionIcon as={LuFilePlus} />}
        >
          {t`New`}
        </Button>
        <Button
          size="sm"
          as={Link}
          to="/swap/pending"
          leftIcon={<ActionIcon as={TbClockHour7} />}
        >
          {t`Pending`}
        </Button>
        <Button
          size="sm"
          as={Link}
          to="/swap/completed"
          leftIcon={<ActionIcon as={TbChecks} />}
        >
          {t`Completed`}
        </Button>
        <Button
          size="sm"
          as={Link}
          to="/swap/missing"
          leftIcon={<ActionIcon as={TbQuestionMark} />}
        >
          {t`Missing`}
        </Button>
        <Button
          size="sm"
          as={Link}
          to="/swap/load"
          leftIcon={<ActionIcon as={TbFileUpload} />}
        >
          {t`Load`}
        </Button>
      </HStack>
      <Outlet />
    </ContentContainer>
  );
}
