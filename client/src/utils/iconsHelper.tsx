/* eslint-disable react-refresh/only-export-components */

import locationImg from "@tabler/icons/outline/map-pin.svg?url";
import userImg from "@tabler/icons/outline/user-circle.svg?url";
import fileImg from "@tabler/icons/outline/file.svg?url";
import miscellaneousImg from "@tabler/icons/outline/dots-circle-horizontal.svg?url";
import mentionImg from "@tabler/icons/outline/at.svg?url";
import entityImg from "@tabler/icons/outline/border-sides.svg?url";

import type { JSX } from "react";
import {
  IconAt,
  IconBorderSides,
  IconDotsCircleHorizontal,
  IconFile,
  IconMapPin,
  IconSitemap,
  IconUserCircle,
} from "@tabler/icons-react";

export interface Icon {
  name: string;
  url: string;
  component: JSX.Element;
}

const ICON_SIZE = 14;

export const defaultIcon: Icon = {
  name: "Default",
  url: "miscellaneousImg",
  component: <IconDotsCircleHorizontal size={ICON_SIZE} />,
} as const;

export const Icons: Icon[] = [
  {
    url: mentionImg,
    name: "Mention",
    component: <IconAt size={ICON_SIZE} />,
  },
  {
    url: entityImg,
    name: "Entity",
    component: <IconBorderSides size={ICON_SIZE} />,
  },
  {
    url: fileImg,
    name: "Document",
    component: <IconFile size={ICON_SIZE} />,
  },
  {
    url: locationImg,
    name: "Location",
    component: <IconMapPin size={ICON_SIZE} />,
  },
  {
    url: userImg,
    name: "Person",
    component: <IconUserCircle size={ICON_SIZE} />,
  },
  {
    url: userImg,
    name: "Organization",
    component: <IconSitemap size={ICON_SIZE} />,
  },
  {
    url: miscellaneousImg,
    name: "Miscellaneous",
    component: <IconDotsCircleHorizontal size={ICON_SIZE} />,
  },
];

export const IconMap = new Map<string, Icon>(
  Icons.map((icon) => [icon.name, icon]),
);
