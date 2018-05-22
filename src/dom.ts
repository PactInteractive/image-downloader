import * as React from 'react';

export { Component } from 'react';
export { render } from 'react-dom';

export type Props<
  ElementType = HTMLDivElement,
  ReactElementType = React.AllHTMLAttributes<ElementType>
> = React.DetailedHTMLProps<ReactElementType, ElementType>;
