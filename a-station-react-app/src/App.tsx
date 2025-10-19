import { Button } from "@/components/ui/button";
import "./index.css";
const App = () => {
  return (
    <>
      <main className="bg-background h-full">
        <p className="text-7xl">Hello World!</p>
        <Button variant={"outline"} onClick={() => alert("Hello World!")}>
          Click me
        </Button>
      </main>
    </>
  );
};

export default App;
