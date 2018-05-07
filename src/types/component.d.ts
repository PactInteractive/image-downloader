import { VNode } from 'preact';

declare global {
  export type Props<ElementType = HTMLElement> = CustomProps<Partial<ElementType>>;
}

type CustomProps<P extends {}> = P & Partial<ComponentProps<P>>;

interface ComponentProps<P extends {}> {
  class: string;
  children: JSX.Element[];
  key: string | number | any;
  ref(el: any): void;
}
