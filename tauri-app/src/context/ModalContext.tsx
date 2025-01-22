import { createContext, FC, PropsWithChildren, RefObject, useRef } from "react";

export interface ModalContext {
  ref: RefObject<HTMLElement>;
}

export const modalContext = createContext<ModalContext>({} as ModalContext);

export const ModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const ref = useRef(null);

  return (
    <modalContext.Provider value={{ ref }}>
      <>
        {children}
        <div ref={ref} />
      </>
    </modalContext.Provider>
  );
};
