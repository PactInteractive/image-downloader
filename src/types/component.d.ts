// Importing a library makes this file a module, which allows us to declare global types:
// https://stackoverflow.com/questions/26955140/how-to-include-ambient-module-declarations-inside-another-ambient-module
import * as React from 'react';

declare global {
  export type Props<
    ElementType = HTMLDivElement,
    ReactElementType = React.AllHTMLAttributes<ElementType>
  > = React.DetailedHTMLProps<ReactElementType, ElementType>;
}
