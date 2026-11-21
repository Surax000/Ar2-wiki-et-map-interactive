(() => {
    const offlineBanner = document.getElementById('offline-banner');
    const updateOfflineStatus = () => {
        if (offlineBanner) offlineBanner.classList.toggle('hidden', navigator.onLine);
    };
    updateOfflineStatus();
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);

    const freshness = document.getElementById('data-freshness');
    if (freshness) {
        fetch('./data-version.json?v=20261121', { cache: 'no-store' })
            .then(response => {
                if (!response.ok) throw new Error(`Impossible de charger la version des données (${response.status}).`);
                return response.json();
            })
            .then(meta => {
                if (!meta.revision || !meta.snapshotDate || !meta.notice) {
                    throw new Error('Le manifeste de version des données est incomplet.');
                }
                freshness.textContent = `Données ${meta.revision} — snapshot du ${meta.snapshotDate}. ${meta.notice}`;
            })
            .catch(error => {
                console.error('AR2 : statut des données indisponible.', error);
                freshness.textContent = 'Statut de fraîcheur des données indisponible.';
            });
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .catch(error => console.error('AR2 : enregistrement hors ligne impossible.', error));
        });
    }
})();
