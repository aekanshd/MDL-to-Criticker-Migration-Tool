const lines = [
  "1 Crash Landing on You Completed South Korea 2019 Drama 9.5 16/16",
  "53 Alice in Borderland Completed Japan 2020 Drama 8.0 8 / 8",
  "79 Love Next Door Plan to Watch South Korea 2024 Drama 0.0 0 / 16",
  "77 Suspicious Partner On-hold South Korea 2017 Drama 0.0 0/40",
  "120 The Legend of the Blue Sea Watching South Korea 2016 Drama 0.0 2/20",
  "some random text",
  "4 Happiness Completed South Korea 2021 Drama 9.5 12/12",
  "36 Sh**ting Stars Completed South Korea 2022 Drama 8.5 16/16 "
];

lines.forEach(line => {
  const match = line.trim().match(/^(?:\d+)\s+(.*?)\s+(?:Completed|Watching|On-hold|Dropped|Plan to Watch|Undecided|Not Interested)\s+(?:.*?)\s+\d{4}\s+(?:.*?)\s+(\d{1,2}(?:\.\d)?)\s+/);
  if (match) {
     console.log("Matched: Title='", match[1], "' Score='", match[2], "'");
  } else {
     console.log("NO MATCH:", line);
  }
});
