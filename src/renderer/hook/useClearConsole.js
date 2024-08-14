const { useEffect } = require('react');

const useClearConsole = () => {
  useEffect(() => {
    console.clear();
  }, []);
};


export default useClearConsole
