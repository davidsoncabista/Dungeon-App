import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [state, setState] = React.useState({
    isMobile: false,
    isHydrated: false,
  });

  React.useEffect(() => {
    const checkDevice = () => {
        setState({
            isMobile: window.innerWidth < MOBILE_BREAKPOINT,
            isHydrated: true,
        });
    };
    
    checkDevice();

    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return state;
}
