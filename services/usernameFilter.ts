const reservedNames = [
  "admin",
  "administrator",
  "owner",
  "support",
  "moderator",
  "scott",
  "procode",
  "fuck",
  "fucker",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "sex",
  "porn",
  "nazi",
  "terrorist",
];

export const validateUsername =
(
  username: string
) => {

  const trimmed =
    username.trim();
  
  if (
    trimmed.length < 3 ||
    trimmed.length > 20
  ) {
    return
      "Username must be 3-20 characters";
  }

  if (
    !/^[A-Za-z0-9_]+$/.test(
      trimmed
    )
  ) {
    return
      "Only letters, numbers and _ allowed";
  }

  if (
    reservedNames.includes(
      trimmed.toLowerCase()
    )
  ) {
    return
      "This username is not allowed";
  }

  return null;
};