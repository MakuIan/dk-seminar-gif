def create_base_dictionary(s: str):
    dictionary = {}
    next_code = 0

    for ch in s:
        if ch not in dictionary:
            dictionary[ch] = next_code
            next_code += 1

    return dictionary


def lzw_encode(s: str, dictionary: dict):
    dict_enc = dictionary.copy()
    next_code = max(dict_enc.values()) + 1 if dict_enc else 0

    LW = ""
    output_codes = []

    for Z in s:
        if LW + Z in dict_enc:
            LW = LW + Z
        else:
            if LW != "":
                output_codes.append(dict_enc[LW])
            dict_enc[LW + Z] = next_code
            next_code += 1
            LW = Z

    if LW != "":
        output_codes.append(dict_enc[LW])

    return output_codes, dict_enc


def lzw_decode(codes: list, dictionary: dict):
    dict_dec = {v: k for k, v in dictionary.items()}
    next_code = max(dict_dec.keys()) + 1 if dict_dec else 0

    I = dict_dec[codes[0]]
    output = [I]

    for current in codes[1:]:
        if current in dict_dec:
            J = dict_dec[current]
        else:
            J = I + I[0]

        dict_dec[next_code] = I + J[0]
        next_code += 1

        output.append(J)
        I = J

    return "".join(output), dict_dec


# -----------------------------
# Testfunktion für mehrere Strings
# -----------------------------
def run_tests(test_strings):
    for idx, s in enumerate(test_strings, 1):
        base_dict = create_base_dictionary(s)
        codes, enc_dict = lzw_encode(s, base_dict)
        decoded, dec_dict = lzw_decode(codes, base_dict)

        print(f"Test {idx}:")
        print("Original:", s)
        print("Codes   :", codes)
        print("Decoded :", decoded)
        print("OK      :", s == decoded)
        print("-" * 40)


# -----------------------------
# Main-Methode
# -----------------------------
def main():
    test_strings = [
        "ABABABA",
        "HELLO WORLD",
        "aaaaaa",
        "ABCDEF",
        "ABABABABAB",
        "äöüÄÖÜß"
    ]
    run_tests(test_strings)


# -----------------------------
# Startpunkt
# -----------------------------
if __name__ == "__main__":
    main()