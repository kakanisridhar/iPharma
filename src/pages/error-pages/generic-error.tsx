import { Error } from "./components/Error";
import { useRouteError } from "react-router";


export function GenericError() {
  const error = useRouteError();
  console.error(error);

  return (
    <Error
      code={error.statusText || error.message}
      description={'Sorry, an unexpected error has occurred.'}
    />
  );
}
