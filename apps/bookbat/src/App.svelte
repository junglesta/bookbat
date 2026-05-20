<script lang="ts">
    import { onMount } from "svelte";
    import Nav from "./components/Nav.svelte";
    import SplashScreen from "./components/SplashScreen.svelte";
    import Toast from "./components/Toast.svelte";
    import ActionButton from "./components/ActionButton.svelte";
    import ScanPage from "./pages/ScanPage.svelte";
    import LibraryPage from "./pages/LibraryPage.svelte";
    import ExportPage from "./pages/ExportPage.svelte";
    import { getRoute, loadBooks } from "./lib/stores.svelte";
    import splashHelpUrl from "./assets/readme.svg";
    import splashStartUrl from "./assets/startscreen.svg";
    import splashQrUrl from "./assets/splash-qr.svg";
    import { version } from "../package.json";

    let splashDone = $state(false);
    let splashMode = $state<"startup" | "help" | "share">("startup");
    let startupSplashTimer: ReturnType<typeof setTimeout> | null = null;
    let startupSplashPersistent = $state(false);

    function clearStartupSplashTimer() {
        if (startupSplashTimer) {
            clearTimeout(startupSplashTimer);
            startupSplashTimer = null;
        }
    }

    function openStartupSplash(persistent = false) {
        clearStartupSplashTimer();
        startupSplashPersistent = persistent;
        splashMode = "startup";
        splashDone = false;
        if (!persistent) {
            startupSplashTimer = setTimeout(() => {
                splashDone = true;
                startupSplashTimer = null;
            }, 1400);
        }
    }

    onMount(() => {
        document.title = `BOOK BAT v${version}`;
        loadBooks();
        openStartupSplash();
        return () => clearStartupSplashTimer();
    });

    function openHelpSplash() {
        clearStartupSplashTimer();
        startupSplashPersistent = false;
        splashMode = "help";
        splashDone = false;
    }

    function openShareSplash() {
        clearStartupSplashTimer();
        startupSplashPersistent = false;
        splashMode = "share";
        splashDone = false;
    }

    function maybeCloseSplash() {
        if (splashMode !== "startup" || startupSplashPersistent) {
            clearStartupSplashTimer();
            startupSplashPersistent = false;
            splashDone = true;
        }
    }

</script>

{#if !splashDone}
    {#if splashMode === "help"}
        <SplashScreen onclick={maybeCloseSplash} ariaLabel="Close splash screen">
            <div class="splash_media_scroll">
                <img class="splash_help_image" src={splashHelpUrl} alt="BOOK BAT readme screen" />
            </div>
        </SplashScreen>
    {:else if splashMode === "share"}
        <SplashScreen onclick={maybeCloseSplash} ariaLabel="Close share splash" layout="centered">
            <div class="splash_share_content">
                <img src={splashQrUrl} alt="QR code to share BOOK BAT" />
                <p class="splash_share_url">https://bat.junglestar.org</p>
            </div>
        </SplashScreen>
    {:else if startupSplashPersistent}
        <SplashScreen onclick={maybeCloseSplash} ariaLabel="Close start screen">
            <div class="splash_media_scroll">
                <img class="splash_help_image" src={splashStartUrl} alt="BOOK BAT start screen" />
            </div>
        </SplashScreen>
    {:else}
        <SplashScreen dismissible={false} layout="fill" animated={true}>
            <div class="splash_media_scroll splash_media_scroll_fill">
                <img class="splash_help_image" src={splashStartUrl} alt="BOOK BAT start screen" />
            </div>
        </SplashScreen>
    {/if}
{:else}
    <div class="app">
        <main class="page">
            {#if getRoute() === "#/scan" || getRoute() === "" || getRoute() === "#/"}
                <ScanPage />
            {:else if getRoute() === "#/library"}
                <LibraryPage />
            {:else if getRoute() === "#/export"}
                <ExportPage />
            {:else}
                <ScanPage />
            {/if}
            <footer class="app_brand_footer">
                <span>
                    <a href="#/" class="app_brand_name_link" onclick={(event) => {
                        event.preventDefault();
                        openStartupSplash(true);
                    }}>
                        BOOK BAT
                    </a>
                    <span class="app_brand_version">v{version}</span>
                </span>
                <span>
                    it's an
                    <a
                        href="https://github.com/junglesta/bookbat"
                        target="_blank"
                        rel="noreferrer noopener"
                        >open source</a
                    >
                    webapp by
                    <a href="https://junglestar.org" target="_blank" rel="noreferrer noopener"
                        >junglestar.org</a
                    >
                </span>
                <div class="footer_actions">
                    <ActionButton
                        buttonClass="footer_action_btn"
                        icon="help"
                        labelLines={["Help"]}
                        compact={true}
                        onclick={openHelpSplash}
                    />
                    <ActionButton
                        buttonClass="footer_action_btn"
                        icon="share"
                        labelLines={["Share", "This", "App"]}
                        compact={true}
                        onclick={openShareSplash}
                    />
                </div>
            </footer>
        </main>

        <Nav />
        <Toast />
    </div>
{/if}
