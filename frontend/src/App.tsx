import { helloService } from "./services/hello.service"

function App() {

  const handleGetHello = async () => {
    const response = await helloService.getHello();
    console.log(response);
  }

  return (
    <>
      <button className="bg-blue-500 text-white p-2 rounded-md" onClick={handleGetHello}>Get Hello</button>
    </>
  )
}

export default App
