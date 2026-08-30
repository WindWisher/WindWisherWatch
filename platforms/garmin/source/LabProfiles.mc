class LabProfiles {
    private const PROFILES = ["LOW", "MEDIUM", "HIGH", "MAX_SUPPORTED"];

    function count() { return PROFILES.size(); }
    function name(index) { return PROFILES[index % PROFILES.size()]; }

    function requestedRate(profile, maxSupported) {
        if (profile.equals("LOW")) { return clamp(10, maxSupported); }
        if (profile.equals("MEDIUM")) { return clamp(25, maxSupported); }
        if (profile.equals("HIGH")) { return clamp(50, maxSupported); }
        return maxSupported;
    }

    function clamp(requested, maxSupported) {
        if (maxSupported == null || maxSupported <= 0) { return 0; }
        return requested < maxSupported ? requested : maxSupported;
    }
}
