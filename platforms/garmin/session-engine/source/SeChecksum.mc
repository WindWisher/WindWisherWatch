class SeChecksum {
    function calculate(value) {
        // Adler-32 detects accidental corruption. It is not authentication.
        var first = 1;
        var second = 0;
        var characters = value.toCharArray();
        for (var index = 0; index < characters.size(); index += 1) {
            first = (first + characters[index].toNumber()) % 65521;
            second = (second + first) % 65521;
        }
        return (second * 65536l) + first;
    }
}
