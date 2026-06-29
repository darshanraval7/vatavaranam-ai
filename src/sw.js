// તમારા index.js ની છેલ્લી લાઇનોમાં આ ઉમેરો:
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Vatavaranam SW Registered!', reg.scope))
      .catch((err) => console.log('SW Registration Failed!', err));
  });
}