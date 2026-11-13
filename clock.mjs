let timer;
let settingsSubscription;

export default function activate(orca) {
  const update = async () => {
    try {
      const format = await orca.settings.get('hourFormat');
      await orca.host.call('statusBar.update', {
        id: 'clock',
        text: new Date().toLocaleTimeString(undefined, {
          hour: '2-digit', minute: '2-digit',
          hour12: format === '12-hour' ? true : format === '24-hour' ? false : undefined,
        }),
      });
    } catch (error) {
      orca.log(`Clock update failed: ${error}`);
    }
  };

  settingsSubscription = orca.settings.onDidChange(update);
  timer = setInterval(update, 1000);
  return update();
}

export function deactivate() {
  clearInterval(timer);
  settingsSubscription?.dispose();
}
